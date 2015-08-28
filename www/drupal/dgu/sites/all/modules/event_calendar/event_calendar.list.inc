<?php

/**
 * @file
 * Event administration UI.
 */

/**
 * Form builder: Builds the event administration overview.
 *
 * @see event_available_terms()
 * @see event_build_filter_query()
 * @see event_calendar_dates()
 * @see event_calendar_status()
 */
function event_admin_events() {
  $admin_access = user_access('administer event status');
  $node_type = variable_get('event_calendar_node_type', 'event_calendar');

  // Build the 'Update options' form.
  $form['options'] = array(
    '#type' => 'fieldset',
    '#title' => t('Update Status'),
    '#attributes' => array('class' => array('container-inline')),
    '#access' => $admin_access,
  );
  $options = event_available_terms();
  // Unset 'any' option.
  unset($options['0']);
  // Sort options array.
  asort($options);
  $form['options']['operation'] = array(
    '#type' => 'select',
    '#title' => t('Operation'),
    '#title_display' => 'invisible',
    '#options' => $options,
    '#default_value' => 'approve',
  );
  $form['options']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Update'),
    '#validate' => array('event_admin_events_validate'),
    '#submit' => array('event_admin_events_submit'),
  );

  // Build the sortable table header.
  $header = array(
    'title' => array('data' => t('Title'), 'field' => 'n.title'),
    'start-date' => array('data' => t('Poèetni datum (y-m-d)'),
    'field' => 'n.changed', 'sort' => 'desc'),
    'end-date' => array('data' => t('End Date (y-m-d)'),
    'field' => 'n.changed', 'sort' => 'desc'),
    'status' => array('data' => t('Status'), 'field' => 'n.status'),
  );

  $query = db_select('node', 'n')->extend('PagerDefault')->extend('TableSort');
  event_build_filter_query($query);

  $nids = $query
    ->fields('n', array('nid'))
    ->condition('type', $node_type)
    ->limit(50)
    ->orderByHeader($header)
    ->addTag('node_access')
    ->execute()
    ->fetchCol();
  $nodes = node_load_multiple($nids);

  // Prepare the list of event nodes.
  $languages = language_list();
  $destination = drupal_get_destination();
  $options = array();
  foreach ($nodes as $node) {
    // Collect events Dates.
    $dates = event_calendar_dates($node);
    // Collect events status/
    $status = event_calendar_status($node);
    // Set flag for expired events.
    if (is_event_expired($node, 'load')) {
      $flag1 = t("<i>**");
      $flag2 = t("</i>");
    }
    else {
      $flag1 = "";
      $flag2 = "";
    }
    $langcode = '';
    if (function_exists('entity_language')) {
		$langcode = entity_language('node', $node);	
	}
    
    $l_options = $langcode != LANGUAGE_NONE && isset($languages[$langcode]) ? array('language' => $languages[$langcode]) : array();
    $options[$node->nid] = array(
      'title' => array(
        'data' => array(
          '#type' => 'link',
          '#title' => $node->title,
          '#href' => 'node/' . $node->nid,
          '#options' => $l_options,
          '#suffix' => ' ' . theme('mark', array('type' => node_mark($node->nid, $node->changed))),
        ),
      ),
      'start-date' => $dates['start_date'],
      'end-date' => $dates['end_date'],
      'status' => $flag1 . $status . $flag2,
    );
  }

  $form['events'] = array(
    '#type' => 'tableselect',
    '#header' => $header,
    '#options' => $options,
    '#empty' => t('No content available.'),
  );

  $form['pager'] = array('#markup' => theme('pager'));
  return $form;
}

/**
 * Menu callback: Events administration.
 */
function event_calendar_content($form, $form_state) {
  // Form elements to provide filter options.
  $form['filter'] = event_filter_form();
  // Submit callback to filter events.
  $form['#submit'][] = 'event_filter_form_submit';
  // Form elements to provide list of events.
  $form['admin_events'] = event_admin_events();
  // Form elements to provide status explaination.
  $form['event_calendar_note'] = event_calendar_status_note();

  return $form;
}

/**
 * Callback function Form element and form element explaining status state.
 */
function event_calendar_status_note() {
  // From element to explain expired events.
  $form['event_status_note'] = array(
    '#type' => 'item',
    '#markup' => t('<i>** these events are expired.</i>'),
  );
  return $form;
}

/**
 * Callback function events status,
 * If event is expired then return a custom status as 'expired'.
 */
function event_calendar_status($node) {
  // Build query to fetch status of events.
  $query = db_select('field_data_event_calendar_status', 'ecs');
  $query->join('taxonomy_term_data', 'td', 'td.tid = ecs.event_calendar_status_tid');
  $query->fields('td', array('name'))
        ->condition('ecs.entity_id', $node->nid);
  $result = $query->execute();
  foreach ($result as $status) {
    return $status->name;
  }
}


/**
 * Callback: function to collect events start date and end date.
 */
function event_calendar_dates($node) {
  // Build query to fetch events dates.
  // Event start date.
  $dates = array(NULL);
  $field_lang_code = field_language('node', $node, 'event_calendar_date', LANGUAGE_NONE);
  if(isset($node->event_calendar_date[$field_lang_code][0]['value'])) {
    $dates['start_date'] = $node->event_calendar_date[$field_lang_code][0]['value'];
    // Event end date.
  }
  if(isset($node->event_calendar_date[$field_lang_code][0]['value2'])) {
    $dates['end_date'] = $node->event_calendar_date[$field_lang_code][0]['value2'];
  }
  return $dates;
}

/**
 * Callback: Function to collect available terms for event calendar.
 */
function event_available_terms() {
  // Build query to fetch available terms.
  $vid = db_query("SELECT vid FROM {taxonomy_vocabulary} WHERE machine_name = :machine_name",
    array  (':machine_name' => TAXONOMY_NAME))
      ->fetchField();
  // Get all terms of a vocabulary.
  $taxonomy = taxonomy_get_tree($vid);
  // Add an extra option 'any', will be show as filter option.
  $terms = array('any');
  foreach ($taxonomy as $term) {
    $terms[$term->tid] = $term->name;
  }
  return $terms;
}

/**
 * Return form for events node administration filters.
 */
function event_filter_form() {
  // Collect all terms to show in filter option.
  $terms = event_available_terms();
  asort($terms);
  // Creating filter form.
  $form['filters'] = array(
    '#type' => 'fieldset',
    '#title' => t('Show only events where'),
    '#theme' => 'exposed_filters__node',
  );
  if (!empty($_SESSION['event_overview_filter'])) {
    // Find filter status.
    $status = db_query("SELECT name FROM {taxonomy_term_data} WHERE tid = :tid",
    array(':tid' => $_SESSION['event_overview_filter']))->fetchField();
    // Extra field to show filter status.
    $form['filters']['status']['text'] = array(
      '#markup' => t('where status is <b> %status </b>', array('%status' => $status)),
      '#value' => t('Reset'),
    );
  }
  $form['filters']['status']['filters'] = array(
    '#title' => t('status'),
    '#type' => 'select',
    '#options' => $terms,
  );
  $form['filters']['status']['actions'] = array(
    '#type' => 'actions',
    '#attributes' => array('class' => array('container-inline')),
  );
  $form['filters']['status']['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Filter'),
  );
  if (!empty($_SESSION['event_overview_filter'])) {
    $form['filters']['status']['actions']['reset'] = array(
      '#type' => 'submit',
      '#value' => t('Reset'),
    );
  }
  return $form;
}

/**
 * Apply filters for event node administration filters based on session.
 *
 * @param string $query
 *   A Select Query to which the filters should be applied.
 */
function event_build_filter_query(SelectQueryInterface $query) {
  // Build query.
  $filter_data = isset($_SESSION['event_overview_filter']) ? $_SESSION['event_overview_filter'] : '';
  if ($filter_data) {
    $query->join('field_data_event_calendar_status', 'ecs', 'ecs.entity_id = n.nid');
    $query->condition('ecs.event_calendar_status_tid', $filter_data);
  }

}

/**
 * Process result from event node administration filter form.
 */
function event_filter_form_submit($form, &$form_state) {
  $filters = $form_state['values']['filters'];
  if (!empty($_SESSION['event_overview_filter'])) {
    unset($_SESSION['event_overview_filter']);
  }
  if ($filters) {
    $_SESSION['event_overview_filter'] = $filters;
  }
}

/**
 * Validate event_admin_events form submissions.
 *
 * Check if any nodes have been selected to perform the chosen
 * 'Update option' on.
 */
function event_admin_events_validate($form, &$form_state) {
  // Error if there are no items to select.
  if (!is_array($form_state['values']['events']) || !count(array_filter($form_state['values']['events']))) {
    form_set_error('', t('No event selected.'));
  }
}

/**
 * Process event_admin_events form submissions.
 *
 * Execute the chosen 'Update option' on the selected nodes.
 */
function event_admin_events_submit($form, &$form_state) {
  // Filter out unchecked event nodes.
  $events = array_filter($form_state['values']['events']);
  // Find out the term id.
  $op = $form_state['values']['operation'];
  global $user;
  $node_type = variable_get('event_calendar_node_type', 'event_calendar');
  // Update each selected event node with new taxonomy status.
  foreach ($events as $nid) {
    $obj = node_load($nid);
    $field_lang_code = field_language('node', $obj, 'event_calendar_date', LANGUAGE_NONE);  
    $obj->event_calendar_status[$field_lang_code][0]['tid'] = $op;
    $node_save = node_save($obj);
  }
  drupal_set_message(t('The status has been changed.'));
}
