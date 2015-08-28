<?php

/**
 * Implements hook_field_widget_info().
 */
function ckan_publisher_tree_field_widget_info() {
  return array(
    'ckan_publisher_tree' => array(
      'label' => t('Publisher reference tree'),
      'field types' => array('ckan_publisher_reference'),
      'behaviors' => array(
        'multiple values' => FIELD_BEHAVIOR_CUSTOM,
        'default value' => FIELD_BEHAVIOR_DEFAULT,
      ),
      'settings' => array(
        'start_minimized' => 0,
      ),
    ),
  );
}

/**
 * Implements hook_field_widget_settings_form().
 */
function ckan_publisher_tree_field_widget_settings_form($field, $instance) {
  $widget = $instance['widget'];
  $settings = $widget['settings'];
  $form = array();

  if ($widget['type'] == 'ckan_publisher_tree') {
    $form['start_minimized'] = array(
      '#type' => 'checkbox',
      '#title' => t('Start minimized'),
      '#description' => t('Make the tree appear minimized on the form by default'),
      '#default_value' => $settings['start_minimized'],
      '#return_value' => 1,
    );

  }

  return $form;
}

/**
 * Process the publisher_tree widget.
 *
 * This function processes the publisher_tree widget.
 *
 * @param $element
 *   The element to be drawn.$element['#field_name']
 * @param $form_state
 *   The form state.
 *
 * @return
 *   The processed element.
 */
function ckan_publisher_tree_process_publisher_tree($element, $form_state) {
  if (is_array($form_state)) {
    $value = !empty($element['#default_value']) ? $element['#default_value'] : array();

    if (empty($element['#options'])) {
      $element['#options_tree'] = _ckan_publisher_tree_get_publisher_hierarchy($value);

      $required = $element['#required'];
      if (!$required) {
        array_unshift($element['#options_tree'], (object) array(
          'id' => '',
          'title' => 'N/A',
          'depth' => 0,
        ));
      }
      $element['#options'] = _ckan_publisher_tree_get_options($element['#options_tree']);
    }
    $element['#tree'] = TRUE;

    $tree = new stdClass();
    $tree->children = !empty($element['#options_tree']) ? $element['#options_tree'] : array();
    $element[] = _ckan_publisher_tree_build_level($element, $tree, $form_state, $value, array(), 1);
  }

  return $element;
}


/**
 * Implements hook_field_widget_form().
 */
function ckan_publisher_tree_field_widget_form(&$form, &$form_state, $field, $instance, $langcode, $items, $delta, $element) {
  $settings = $instance['widget']['settings'];

  $path = drupal_get_path('module', 'ckan_publisher_tree');

  $value_key = key($field['columns']);

  $default_value = array();
  foreach ($items as $item) {
    $key = $item[$value_key];
    if ($key === 0) {
      $default_value[$key] = '0';
    }
    else {
      $default_value[$key] = $key;
    }
  }

  $multiple = $field['cardinality'] > 1 || $field['cardinality'] == FIELD_CARDINALITY_UNLIMITED;
  $properties = array();

  if (!array_key_exists('#value', $element)) {
    $element['#value'] = array();
  }

  // A switch statement, in case we ever add more widgets to this module.
  switch ($instance['widget']['type']) {
    case 'ckan_publisher_tree':
      $element['#attached']['js'] = array($path . '/ckan_publisher_tree.js');
      $element['#attached']['css'] = array($path . '/ckan_publisher_tree.css');
      $element['#type'] = 'publisher_tree';
      $element['#default_value'] = $multiple ? $default_value : array(reset($default_value) => reset($default_value));
      $element['#start_minimized'] = $settings['start_minimized'];
      break;
  }

  $element += array(
    '#value_key' => $value_key,
    '#element_validate' => array('_ckan_publisher_tree_widget_validate'),
    '#properties' => $properties,
  );

  return $element;
}


function _ckan_publisher_tree_widget_validate(&$element, &$form_state) {
  $items = _ckan_publisher_tree_flatten($element, $form_state);
  $value = array();

  // If it's a tree of radio buttons, they all have the same value, so we can just
  // grab the value of the first one.
  if (count($items) > 0) {
    $child = reset($items);
    if (!empty($child['#value'])) {
      array_push($value, array($element['#value_key'] => $child['#value']));
    }
  }

  if ($element['#required'] && empty($value)) {
    // The title is already check_plained so it's appropriate to use !.
    form_error($element, t('!name field is required.', array('!name' => $element['#title'])));
  }

  form_set_value($element, $value, $form_state);
  return $element;
}

function _ckan_publisher_tree_build_item($element, $publisher, $form_state, $value, $parent_ids, $depth) {

  $container = array(
    '#type' => 'publisher_tree_item',
    '#depth' => $depth,
  );

  $item = array(
    '#type' => 'radio',
    '#title' => $publisher->title,
    '#on_value' => $publisher->id,
    '#off_value' => 0,
    '#return_value' => $publisher->id,
    '#default_value' => isset($value[$publisher->id]) ? $publisher->id : NULL,
    '#attributes' => isset($element['#attributes']) ? $element['#attributes'] : NULL,
    '#ajax' => isset($element['#ajax']) ? $element['#ajax'] : NULL,
  );

  if (isset($publisher->parent_id)) {
    $item['#parent_values'] = $publisher->parent_id;
  }

  $parents_for_id = array_merge($element['#parents'], array($publisher->id));
  $item['#id'] = drupal_html_id('edit-' . implode('-', $parents_for_id));
  $item['#parents'] = $element['#parents'];

  $container[$publisher->id] = $item;

  if (property_exists($publisher, 'children') && count($publisher->children) > 0) {
    $parents = $parent_ids;
    $parents[] = $publisher->id;
    $container[$publisher->id . '-children'] = _ckan_publisher_tree_build_level($element, $publisher, $form_state, $value, $parents, $depth + 1);
    $container['#level_start_minimized'] = $container[$publisher->id . '-children']['#level_start_minimized'];
  }

  return $container;
}

function _ckan_publisher_tree_build_level($element, $publisher, $form_state, $value, $parent_ids, $depth) {

  $container = array(
    '#type' => 'publisher_tree_level',
    '#depth' => $depth,
  );

  $container['#level_start_minimized'] = $depth > 1 && $element['#start_minimized'] && !($publisher->children_selected);

  foreach ($publisher->children as $child) {
    $container[$child->id] = _ckan_publisher_tree_build_item($element, $child, $form_state, $value, $parent_ids, $depth);
  }

  return $container;
}
