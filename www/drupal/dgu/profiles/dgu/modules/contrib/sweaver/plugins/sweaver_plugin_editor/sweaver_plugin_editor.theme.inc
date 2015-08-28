<?php

/**
 * @file
 * Sweaver theming functions.
 */

/**
 * Editor properties drag and drop configuration form.
 */
function template_preprocess_sweaver_plugin_editor_config_editor(&$vars) {
  $form = &$vars['form'];
  $rows = array();

  // Iterate containers.
  foreach ($form['#containers'] as $container_key => $container_name) {

    drupal_add_tabledrag('properties', 'match', 'sibling', 'property-container-select', 'property-container-'. $container_key, NULL, TRUE);
    drupal_add_tabledrag('properties', 'order', 'sibling', 'property-weight', 'property-weight-'. $container_key, NULL, TRUE);

    $rows[$container_key]['textfield'] = drupal_render($form['container_form_'. $container_key]);

    // Iterate over properties in this container.
    if (isset($form['#properties_region'][$container_key])) {
      ksort($form['#properties_region'][$container_key]);
      foreach ($form['#properties_region'][$container_key] as $property_key => $property) {
        $row = new stdClass;
        $row->name = drupal_render($form[$property]['name']);
        $row->weight = drupal_render($form[$property]['weight']);
        $row->container = drupal_render($form[$property]['container']);
        $rows[$container_key]['properties'][$property] = $row;
      }
    }
  }

  $vars['rows'] = $rows;
  $vars['submit'] = drupal_render_children($form);

  drupal_add_js('misc/tableheader.js');
  drupal_add_css(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_editor/sweaver_plugin_editor.admin.css');
  drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_editor/sweaver_plugin_editor.admin.js');
}
