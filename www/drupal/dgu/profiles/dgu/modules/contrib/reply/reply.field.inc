<?php


/**
 * Implements hook_field_info().
 */
function reply_field_info() {
  return array(
    'reply' => array(
      'label' => t('Reply'),
      'description' => t('Enables users to comment on this entity by reply module.'),
      'default_widget' => 'reply',
      'default_formatter' => 'reply_default',
      'entity_types' => array(),
      'no_ui' => FALSE,
    )
  );
}


/**
 * Implements hook_field_settings_form().
 */
function reply_field_settings_form($field, $instance, $has_data) {
  $bundles = reply_load_bundles();
  $options = array();
  foreach ($bundles AS $bundle) {
    $options[$bundle->bundle] = $bundle->name;
  }

  $form['bundle'] = array(
    '#type' => 'select',
    '#title' => t('Reply bundle'),
    '#default_value' => isset($field['settings']['bundle']) ? $field['settings']['bundle'] : NULL,
    '#options' => $options,
    '#required' => TRUE,
    '#multiple' => FALSE,
  );
  $form['access'] = array(
    '#type' => 'radios',
    '#title' => t('Default access on new content'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_ACCESS_NONE => t('Disabled (Hidden)'),
      REPLY_ACCESS_READ => t('Read only (Closed)'),
      REPLY_ACCESS_FULL => t('Read and write (Open)')
    ),
    '#default_value' => isset($field['settings']['access']) ? $field['settings']['access'] : REPLY_INHERIT
  );
  $form['display'] = array(
    '#type' => 'radios',
    '#title' => t('Display'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_LIST_FLAT => t('Flat list'),
      REPLY_LIST_TREE => t('Threaded list')
    ),
    '#default_value' => isset($field['settings']['display']) ? $field['settings']['display'] : REPLY_INHERIT
  );
  $form['form'] = array(
    '#type' => 'radios',
    '#title' => t('Form position'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_FORM_PAGE_SAME => t('On the same page'),
      REPLY_FORM_PAGE_CUSTOM => t('On custom page')
    ),
    '#default_value' => isset($field['settings']['form']) ? $field['settings']['form'] : REPLY_INHERIT
  );
  $form['allow_reply'] = array(
    '#type' => 'radios',
    '#title' => t('Allow replying on replies'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_ALLOW_REPLY => t('Allow'),
      REPLY_DENY_REPLY => t('Deny')
    ),
    '#default_value' => isset($field['settings']['allow_reply']) ? $field['settings']['allow_reply'] : REPLY_INHERIT
  );

  return $form;
}


/**
 * Implements hook_field_instance_settings_form().
 */
function reply_field_instance_settings_form($field, $instance) {
  $form['access'] = array(
    '#type' => 'radios',
    '#title' => t('Default access on new content'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_ACCESS_NONE => t('Disabled (Hidden)'),
      REPLY_ACCESS_READ => t('Read only (Closed)'),
      REPLY_ACCESS_FULL => t('Read and write (Open)')
    ),
    '#default_value' => isset($instance['settings']['access']) ? $instance['settings']['access'] : REPLY_INHERIT
  );
  $form['display'] = array(
    '#type' => 'radios',
    '#title' => t('Display'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_LIST_FLAT => t('Flat list'),
      REPLY_LIST_TREE => t('Threaded list')
    ),
    '#default_value' => isset($instance['settings']['display']) ? $instance['settings']['display'] : REPLY_INHERIT
  );
  $form['form'] = array(
    '#type' => 'radios',
    '#title' => t('Form position'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_FORM_PAGE_SAME => t('On the same page'),
      REPLY_FORM_PAGE_CUSTOM => t('On custom page')
    ),
    '#default_value' => isset($instance['settings']['form']) ? $instance['settings']['form'] : REPLY_INHERIT
  );
  $form['allow_reply'] = array(
    '#type' => 'radios',
    '#title' => t('Allow replying on replies'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_ALLOW_REPLY => t('Allow'),
      REPLY_DENY_REPLY => t('Deny')
    ),
    '#default_value' => isset($instance['settings']['allow_reply']) ? $instance['settings']['allow_reply'] : REPLY_INHERIT
  );

  return $form;
}


/**
 * Implements hook_field_is_empty().
 *
 * If all of the options are set to REPLY_INHERIT, this field is empty.
 */
function reply_field_is_empty($item, $field) {
  foreach ($item as $value) {
    if ($value != REPLY_INHERIT) {
      return FALSE;
    }
  }

  return TRUE;
}

/**
 * Implements hook_field_formatter_info().
 */
function reply_field_formatter_info() {
  return array(
    'reply_default' => array(
      'label' => t('Default'),
      'field types' => array('reply'),
    )
  );
}


/**
 * Implements hook_field_formatter_view().
 */
function reply_field_formatter_view($entity_type, $entity, $field, $instance, $langcode, $items, $display) {
  $element = array();

  $entity_info = entity_extract_ids($entity_type, $entity);
  $entity_id = $entity_info[0];

  // Add default settings for the case when the field has been attached after
  // the entity was created.
  if (empty($items)) {
    $items = array($instance['settings']);
    $element['#items'] = $items;
  }

  // Hide original field label if set to display 'above', which we handle
  // specially as a header.
  $header = '';
  if ($display['label'] == 'above') {
    $element['#label_display'] = 'hidden';
    $header = check_plain($instance['label']);
  }

  foreach ($items as $delta => $item) {
    $settings = reply_settings($field['settings']['bundle'], $field['settings'], $instance['settings'], $item);
    $ids = reply_get_entity($entity_id, $entity_type, $instance['id']);
    reply_filter_disabled($ids);
    $settings['replies'] = reply_load_multiple($ids);
    $settings['instance_id'] = $instance['id'];
    $settings['entity_id'] = $entity_id;
    $settings['entity'] = $entity;
    $settings['entity_type'] = $entity_type;
    $settings['bundle'] = $field['settings']['bundle'];
    $settings['header'] = $header;
//@todo permissions
    $element[$delta] = array('#markup' => theme('replies', array('elements' => $settings)));
  }

  $element['#attached']['css'] = array(
    drupal_get_path('module', 'reply') .'/reply.css'
  );

  return $element;
}


/**
 * Implements hook_field_widget_info().
 */
function reply_field_widget_info() {
  return array(
    'reply' => array(
      'label' => t('Replies'),
      'field types' => array('reply'),
      'behaviors' => array(
        'multiple values' => FIELD_BEHAVIOR_DEFAULT,
        'default value' => FIELD_BEHAVIOR_NONE,
      ),
    )
  );
}


/**
 * Implements hook_field_widget_form().
 */
function reply_field_widget_form(&$form, &$form_state, $field, $instance, $langcode, $items, $delta, $element) {
  $element['#access'] = user_access('administer reply bundles');
  $element['#type'] = 'fieldset';
  $element['#title'] = $instance['label'];

  $element['access'] = array(
    '#type' => 'radios',
    '#title' => t('Access'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_ACCESS_NONE => t('Disabled (Hidden)'),
      REPLY_ACCESS_READ => t('Read only (Closed)'),
      REPLY_ACCESS_FULL => t('Read and write (Open)')
    ),
    '#default_value' => isset($items[$delta]['access']) ? $items[$delta]['access'] : REPLY_INHERIT
  );
  $element['display'] = array(
    '#type' => 'radios',
    '#title' => t('Display'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_LIST_FLAT => t('Flat list'),
      REPLY_LIST_TREE => t('Threaded list')
    ),
    '#default_value' => isset($items[$delta]['display']) ? $items[$delta]['display'] : REPLY_INHERIT
  );
  $element['form'] = array(
    '#type' => 'radios',
    '#title' => t('Form position'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_FORM_PAGE_SAME => t('On the same page'),
      REPLY_FORM_PAGE_CUSTOM => t('On custom page')
    ),
    '#default_value' => isset($items[$delta]['form']) ? $items[$delta]['form'] : REPLY_INHERIT
  );
  $element['allow_reply'] = array(
    '#type' => 'radios',
    '#title' => t('Allow replying on replies'),
    '#options' => array(
      REPLY_INHERIT => t('Inherit'),
      REPLY_ALLOW_REPLY => t('Allow'),
      REPLY_DENY_REPLY => t('Deny')
    ),
    '#default_value' => isset($items[$delta]['allow_reply']) ? $items[$delta]['allow_reply'] : REPLY_INHERIT
  );

  return $element;
}


/**
 * Implements hook_field_widget_error().
 */
function reply_field_widget_error($element, $error, $form, &$form_state) {
  form_error($element, $error['message']);
}


/**
 * Implements hook_field_delete_instance().
 */
function reply_field_delete_instance($instance) {
  $ids = reply_get_instance($instance['id']);
  reply_delete_multiple($ids);
}
