<?php

/**
 * Returns HTML for a publisher_tree form element.
 *
 * @param $variables
 *   An associative array containing:
 *   - element: An associative array containing the properties of the element.
 *
 * @ingroup themeable
 */
function theme_publisher_tree($variables) {
  $element = $variables['element'];
  $element['#children'] = drupal_render_children($element);

  $attributes = array();
  if (isset($element['#id'])) {
    $attributes['id'] = $element['#id'];
  }
  $attributes['class'][] = 'ckan-publisher-tree';

  if (form_get_error($element)) {
    $attributes['class'][] = 'error';
  }

  if (!empty($element['#required'])) {
    $attributes['class'][] = 'required';
  }

  if (array_key_exists('#start_minimized', $element) && $element['#start_minimized']) {
    $attributes['class'][] = "ckan-publisher-tree-collapsed";
  }

  if (array_key_exists('#cascading_selection', $element) && $element['#cascading_selection']) {
    $attributes['class'][] = "ckan-publisher-tree-cascading-selection";
  }

  if (!empty($element['#attributes']['class'])) {
    $attributes['class'] = array_merge($attributes['class'], $element['#attributes']['class']);
  }
  return
    '<div' . drupal_attributes($attributes) . '>'
    . (!empty($element['#children']) ? $element['#children'] : '')
    . '</div>';
}


/**
 * This function prints a list item with a checkbox and an unordered list
 * of all the elements inside it.
 */
function theme_publisher_tree_level($variables) {
  $element = $variables['element'];
  $sm = '';
  if (array_key_exists('#level_start_minimized', $element) && $element['#level_start_minimized']) {
    $sm = " style='display: none;'";
  }

  $output = "<ul class='ckan-publisher-tree-level '$sm>";
  $children = element_children($element);
  foreach ($children as $child) {
    $output .= "<li>";
    $output .= drupal_render($element[$child]);
    $output .= "</li>";
  }

  $output .= "</ul>";

  return $output;
}

/**
 * This function prints a single item in the tree, followed by that item's children
 * (which may be another publisher_tree_level).
 */
function theme_publisher_tree_item($variables) {
  $element = $variables['element'];
  $children = element_children($element);
  $output = "";

  $sm = isset($element['#level_start_minimized']) && $element['#level_start_minimized'] ? ' ckan-publisher-tree-collapsed' : '';

  if (is_array($children) && count($children) > 1) {
    $output .= "<div class='ckan-publisher-tree-button$sm'></div>";
  }

  foreach ($children as $child) {
    $output .= drupal_render($element[$child]);
  }

  return $output;
}
