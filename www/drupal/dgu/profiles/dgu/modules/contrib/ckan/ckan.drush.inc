<?php

/**
 * Implements hook_drush_command().
 */
function ckan_drush_command() {
  $items = array();
  $items['ckan_update'] = array(
      'callback' => 'ckan_update',
      'description' => 'Pull in CKAN updates',
      'options' => array(
        'kill' => 'Releases lock acquired by previous job.',
      ),
  );

  $items['ckan_resync_dataset'] = array(
      'callback' => 'ckan_resync_dataset',
      'description' => 'Resync CKAN dataset(s)',
      'arguments' => array(
        'id' => 'Dataset ID or "all" to resync all datasets',
      ),
      'options' => array(
        'kill' => 'Releases lock acquired by previous job.',
      ),
  );

  $items['ckan_resync_publisher'] = array(
      'callback' => 'ckan_resync_publisher',
      'description' => 'Resync CKAN publisher(s)',
      'arguments' => array(
        'id' => 'Publisher ID or "all" to resync all publishers',
      ),
      'options' => array(
        'kill' => 'Releases lock acquired by previous job.',
      ),
  );
  $items['ckan_resync_all'] = array(
      'callback' => 'ckan_resync_all',
      'description' => 'Resync CKAN publishers and datasets',
      'options' => array(
        'kill' => 'Releases lock acquired by previous job.',
      ),
  );
  return $items;
}

/**
 * Get all updates since last update check.
 */
function ckan_update() {

  if(!_ckan_lock()) {
    watchdog('ckan_update', 'CKAN update attempted to start while other job still running', array(), WATCHDOG_NOTICE);
    return drush_set_error('CKAN update attempted to start while other job still running');
  }

  $last_revision = variable_get('ckan_last_revision', FALSE);
  if (!$last_revision) {
    watchdog('ckan_update', 'No last revision stored - cannot update', WATCHDOG_ERROR);
    return drush_set_error('No last revision stored - cannot update');
  }

  $client = ckan_get_client();

  watchdog('ckan_update', 'CKAN update started', array(), WATCHDOG_NOTICE);
  variable_set('ckan_update_started', time());

  // Get all revisions since last revision.
  try {
    $revision_list = $client->GetRevisionSinceRevision(array('revision_id' => $last_revision))->toArray();
  }
  catch (Exception $e) {
    drush_print('Error in getting liste of revisions since revision ' . $last_revision);
    drush_print($e->getMessage());
  }
  drush_print('Getting all revisions since revision: ' . $last_revision);
  drush_print(count($revision_list) . ' revisions to update');
  $revision_list = array_slice($revision_list, 0, variable_get('ckan_max_number_of_revisions_in_single_update', 100));
  drush_print(count($revision_list) . ' revisions processed this time');

  $dataset_ids = array();
  $publisher_ids = array();

  // Loop through all revisions and collect distinct id's to avoid multiple
  // updates if a dataset or publisher has been modified multiple times.
  foreach ($revision_list as $revision_id) {
    try {
      $revision = $client->GetRevision(array('id'=>$revision_id))->toArray();
    }
    catch (Exception $e) {
      drush_print('Error getting revision ' . $revision_id);
      drush_print($e->getMessage());
    }

    foreach ($revision['result']['packages'] as $dataset_id) {
      $dataset_ids[$dataset_id] = $dataset_id;
    }

    foreach ($revision['result']['groups'] as $publisher_id) {
      $publisher_ids[$publisher_id] = $publisher_id;
    }
    $last_revision = $revision_id;
  }

  drush_print(count($dataset_ids) . ' datasets to synchronise' );
  drush_print(count($publisher_ids) . ' publishers to synchronise');

  // Crate or update publishers.
  foreach ($publisher_ids as $publisher_id) {
    try {
      $publisher = $client->GetGroup(array('id'=>$publisher_id))->toArray();
      if ($publisher['result']['type'] == 'organization') {
        ckan_synchronise_publisher($publisher['result']);
      }
    }
    catch (Exception $e) {
      drush_print('Error processing publisher ' . $publisher_id);
      drush_print($e->getMessage());
    }
  }

  // Crate or update datasets.
  foreach ($dataset_ids as $dataset_id) {
    try {
      $dataset = $client->GetDataset(array('id'=>$dataset_id))->toArray();
      ckan_synchronise_dataset($dataset['result']);
    }
    catch (Exception $e) {
      drush_print('Error processing dataset ' . $dataset_id);
      drush_print($e->getMessage());
    }
  }

  variable_set('ckan_last_revision', $last_revision);
  lock_release('ckan_update');
}

function ckan_synchronise_dataset($dataset) {

  if (!$dataset_entity = ckan_dataset_load($dataset['id'])) {
    $dataset_entity = new stdClass();
  }

  // Deliberately get NULL if a dataset has no publisher.
  if ($ckan_group_id = $dataset['organization']['id']) {
    if (!$publisher = ckan_publisher_load($ckan_group_id)) {
      $client = ckan_get_client();
      try {
        $publisher = $client->GetGroup(array('id' => $ckan_group_id))->toArray();
        $publisher_id = ckan_synchronise_publisher($publisher['result'])->id;
      }
      catch (Exception $e) {
        drush_print('Error processing publisher ' . $publisher_id);
        drush_print($e->getMessage());
      }
    }
    else {
      $publisher_id = $publisher->id;
    }
  }

  if(isset($dataset['creator_user_id'])) {
    $client = ckan_get_client();
    $user =  $client->GetUser(array('id' => $dataset['creator_user_id']))->toArray();

    if ($uid = get_drupal_uid($user['result'])) {
      $user_entity = user_load($uid);
      if(!$user_entity) {
        watchdog('ckan_update', 'CKAN user ' . $user['id'] . ' (' . $uid . ') doesn\'t exist in Drupal', array(), WATCHDOG_WARNING);
      }
      $dataset_entity->uid = $user_entity->uid;
    }
  }

  $dataset_entity->ckan_id = $dataset['id'];
  $dataset_entity->title = $dataset['title'];
  $dataset_entity->name = $dataset['name'];
  $dataset_entity->notes = $dataset['notes'];
  $dataset_entity->created = strtotime($dataset['metadata_created']);
  $dataset_entity->changed = strtotime($dataset['metadata_modified']);
  $dataset_entity->status = $dataset['state'] == 'active' ? 1 : 0;
  $dataset_entity->inventory = isset($dataset['unpublished']) && $dataset['unpublished'] == TRUE ? 1 : 0;
  $dataset_entity->publisher_id = $publisher_id;

  entity_save('ckan_dataset', $dataset_entity);
  return $dataset_entity;
}

function ckan_synchronise_publisher($publisher) {


  if (!$publisher_entity = ckan_publisher_load($publisher['id'])) {
    $publisher_entity = new stdClass();
  }

  $publisher_entity->ckan_id = $publisher['id'];
  $publisher_entity->title = $publisher['title'];
  $publisher_entity->name = $publisher['name'];
  // 'created' has been removed from API v3, not sure if that's an oversight.
  // For now we are going to keep exising timestamps and create new timestamps on the fly.
  // They will be slightly delayed than original timesamps in CKAN because they will be recording the time when publisher gets written to drupal database.
  // If 'created' comes back in CKAN API we will bring back old code:
  // $publisher_entity->created = strtotime($publisher['created']);
  // and resync publishers
  $publisher_entity->created = $publisher_entity->created ? $publisher_entity->created : time();
  $publisher_entity->status = $publisher['state'] == 'active' ? 1 : 0;

  // Check if this publisher has a parent.
  if (!empty($publisher['groups'][0]['capacity']) && $publisher['groups'][0]['capacity'] == 'public') {
    try {
      $client = ckan_get_client();
      // TODO: Probably not necessaery to synchronise parent if parent already exisit in Drupal.
      $parent_publisher = $client->GetGroup(array('id' => $publisher['groups'][0]['name']))->toArray();
      $parent_publisher_entity = ckan_synchronise_publisher($parent_publisher['result']);
      $publisher_entity->parent_id = $parent_publisher_entity->id;
    }
    catch (Exception $e) {
      drush_print('Error processing parent publisher ' . $parent_publisher_entity->id . ' of publisher ' . $publisher['id']);
      drush_print($e->getMessage());
    }
  }

  entity_save('ckan_publisher', $publisher_entity);

  // Update publisher entity reference in user entity.
  if (!empty($publisher['users'])) {

    foreach ($publisher['users'] as $user) {
      if ($uid = get_drupal_uid($user)) {

        $user_entity = user_load($uid);

        if(!$user_entity) {
          watchdog('ckan_update', 'CKAN user ' . $user['id'] . ' (' . $uid . ') doesn\'t exist in Drupal', array(), WATCHDOG_WARNING);
          continue;
        }

        $publisher_role = variable_get('ckan_publisher_role', FALSE);
        $sysadmin_role = variable_get('ckan_admin_role', FALSE);

        if (ckan_is_sysadmin($user['name'])) {
          $user_entity->roles[$sysadmin_role] = '';
        }

        // Loop through publisher references and find if already exist.
        $publisher_exist = FALSE;
        if (isset($user_entity->field_publishers[LANGUAGE_NONE])) {
          foreach ($user_entity->field_publishers[LANGUAGE_NONE] as $key => $publisher_ref) {
            if ($publisher_ref['target_id'] == $publisher_entity->id) {
              $publisher_exist = TRUE;
            }
          }
        }

        if (!$publisher_exist) {
          // Update publisher reference and apply publisher role if publisher ref doesn't exist.
          $user_entity->field_publishers[LANGUAGE_NONE][] = array('target_id' => $publisher_entity->id);
        }
        elseif (!empty($user_entity->roles[variable_get('ckan_publisher_role', FALSE)])) {
          // Apply publisher role if publisher ref already exist but role not.
        }
        $user_entity->roles[$publisher_role] = '';
        user_save($user_entity);

      }
    }
  }

  return $publisher_entity;
}

/**
 * Check if user is CKAN sysadmin.
 */
function ckan_is_sysadmin($user_id) {
  $client = ckan_get_client();
  $user =  $client->GetUser(array('id' => $user_id))->toArray();
  if (isset($user['result']['sysadmin'])) {
    return $user['result']['sysadmin'];
  }

}

/**
 * Get drupal uid from CKAN user name.
 */
function get_drupal_uid($user) {
  if(substr($user['name'], 0, 6) == 'user_d') {
    return (int) str_replace('user_d', '', $user['name']);
  }
}

/**
 * Resync a publisher or all publishers.
 */
function ckan_resync_all() {
  $started = time();

  ckan_resync_publisher('all');
  ckan_resync_dataset('all');

  $date_time = date('Y-m-d\TH:i:s', $started);
  $client = ckan_get_client();
  try {
    $revision_list = $client->GetRevisionSinceTime(array('date_time' => $date_time))->toArray();
  }
  catch (Exception $e) {
    drush_print('Error getting list of revisions since ' . $date_time);
    drush_print($e->getMessage());
  }
  if (!empty($revision_list)) {
    variable_set('ckan_last_revision', array_shift($revision_list));
  }
}


/**
 * Resync a dataset or all datasets.
 */
function ckan_resync_dataset($id) {

  if (!_ckan_validate_uuid_or_all($id)) {
    return drush_set_error('Please provide dataset ID or "all" to resync all datasets');
  }

  if(!_ckan_lock()) {
    watchdog('ckan_update', 'CKAN resync dataset attempted to start while other job still running', array(), WATCHDOG_NOTICE);
    return drush_set_error('CKAN resync dataset attempted to start while other job still running');
  }

  $client = ckan_get_client();

  if ($id == 'all') {
    try{
      variable_set('ckan_resync_datasets_started', time());
      $response = $client->GetDatasets()->toArray();
      $dataset_ids = $response['result'];
      ckan_delete_deleted_in_ckan('ckan_dataset', $dataset_ids);
    }
    catch (Exception $e) {
      watchdog('ckan_resync_dataset', 'Unable to retrieve list of all datasets from CKAN', array(), WATCHDOG_NOTICE);
      drush_print($e->getMessage());
    }
  }
  else {
    $dataset_ids = array($id);
  }

  $total = count($dataset_ids);
  drush_print('Resyncing ' . $total . ' datasets.');

  // Crate or update datasets.
  foreach ($dataset_ids as $current => $dataset_id) {
    try {
      $dataset = $client->GetDataset(array('id'=>$dataset_id))->toArray();
      ckan_synchronise_dataset($dataset['result']);
      _ckan_update_progress($current, $total, 'dataset');
    }
    catch (Exception $e) {
      drush_print('Error processing dataset ' . $dataset_id);
      drush_print($e->getMessage());
    }
  }
  variable_del('ckan_update_status');
}


/**
 * Resync a publisher or all publishers.
 */
function ckan_resync_publisher($id) {

  if (!_ckan_validate_uuid_or_all($id)) {
    return drush_set_error('Please provide publisher ID or "all" to resync all publishers');
  }

  if(!_ckan_lock()) {
    watchdog('ckan_update', 'CKAN resync publisher attempted to start while other job still running', array(), WATCHDOG_NOTICE);
    return drush_set_error('CKAN resync publisher attempted to start while other job still running');
  }

  $client = ckan_get_client();

  if ($id == 'all') {
    try{
      variable_set('ckan_resync_publishers_started', time());
      $get_group_response = $client->GetGroups()->toArray();
      $publisher_ids = $get_group_response['result'];

    }
    catch (Exception $e) {
      watchdog('ckan_resync_publisher', 'Unable to retrieve list of all publishers from CKAN', array(), WATCHDOG_NOTICE);
      drush_print($e->getMessage());
    }

  }
  else {
    $publisher_ids = array($id);
  }

  $total = count($publisher_ids);
  drush_print('Resyncing ' . $total . ' publishers.');

  // Crate or update publishers.
  foreach ($publisher_ids as $current => $publisher_id) {
    try {
      $publisher = $client->GetGroup(array('id'=>$publisher_id))->toArray();
      ckan_synchronise_publisher($publisher['result']);
      _ckan_update_progress($current, $total, 'publisher')
      ;
    }
    catch (Exception $e) {
      drush_print('Error processing publisher ' . $publisher_id);
      drush_print($e->getMessage());
    }
  }
  variable_del('ckan_update_status');
}

/**
 * Helper function to delete all ckan entities not included in $dataset_ids.
 */
function ckan_delete_deleted_in_ckan($entity_type, $dataset_ids) {
  $ids = db_select($entity_type, e)
    ->fields('e', array('id'))
    ->condition('name', $dataset_ids,'NOT IN')
    ->execute()
    ->fetchCol();
  entity_delete_multiple($entity_type, $ids);
}


/**
 * Helper function to record update progress.
 */
function _ckan_update_progress($current, $total, $entity_type) {
  if($current %10 == 0) {
    variable_set('ckan_update_status', ucfirst($entity_type) . ' update in progress: ' . $current . ' of ' . $total);
  }
}

/**
 * Helper function to validate UUID or "all".
 */
function  _ckan_validate_uuid_or_all($id) {
  return $id == 'all' || preg_match("/^(\{)?[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}(?(1)\})$/i", $id);
}

/**
 * Helper function for locking management to avoid job ovelaps.
 */
function  _ckan_lock() {
  // Try to acquire ckan_update lock.
  if (!lock_acquire('ckan_update', 3600)) {
    // Previous ckan_update is still running for less than one hour.
    if (drush_get_option('kill')) {
      db_delete('semaphore')
        ->condition('name', 'ckan_update')
        ->execute();
      lock_acquire('ckan_update', 3600);
    }
    else {
      return FALSE;
    }
  }
  return TRUE;
}

/**
 * Get a ckan client instance.
 */
function ckan_get_client() {
  // Get clien only if ckan roles are configured, stop script otherwise.
  if (variable_get('ckan_publisher_role', FALSE) && variable_get('ckan_admin_role', FALSE)) {
    try {
      require_once 'sites/all/vendor/autoload.php';
      $client = Silex\ckan\CkanClient::factory(array(
        'baseUrl' => variable_get('ckan_url', ''),
        'apiKey' => variable_get('ckan_apikey', ''),
      ));
      return $client;
    }
    catch (Exception $e) {
      drush_print('Unable to instantiate CKAN client');
      drush_print($e->getMessage());
      exit(2);
    }
  }
  else {
    drush_print('Can\'t get CKAN editor and admin roles, please go to /admin/config/system/ckan and configure them.');
    exit(2);
  }
}
