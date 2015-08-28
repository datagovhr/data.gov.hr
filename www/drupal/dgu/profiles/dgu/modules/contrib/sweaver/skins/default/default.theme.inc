<?php

/**
 * @file
 * Sweaver theming functions.
 */

/**
 * Editor frontend.
 */
function template_preprocess_sweaver_plugin(&$vars) {
  $form = &$vars['form'];
  $active_tab = '';
  $sweaver_open = '';
  $sweaver_height = '';
  $vars['tabs'] = array();
  $vars['tabs_data'] = array();
  $vars['sweaver_popup'] = '';

  $i = 0;
  asort($form['#plugins_order']);
  foreach ($form['#plugins_order'] as $plugin_name => $weight) {
    if ($i == 0 && $plugin_name != 'sweaver_plugin') {
      $active_tab = $plugin_name;
      $i++;
    }
    $object = Sweaver::get_instance()->get_plugin($plugin_name);
    $object->sweaver_form_render($vars, $form, $form['#plugins_full'][$plugin_name]);
  }

  // Active tab.
  if (isset($_COOKIE['sweaver_active_tab']) && !empty($_COOKIE['sweaver_active_tab'])) {
    $active_tab = str_replace('tab-', '', $_COOKIE['sweaver_active_tab']);
  }
  $vars['active_tab'] = $active_tab;

  // Open or closed.
  if (isset($_COOKIE['sweaver_open']) && !empty($_COOKIE['sweaver_open'])) {
    $sweaver_open = $_COOKIE['sweaver_open'];
  }
  $vars['sweaver_open'] = $sweaver_open;
  // Height of content area.
  if (isset($_COOKIE['sweaver_height']) && !empty($_COOKIE['sweaver_height'])) {
    $sweaver_height = $_COOKIE['sweaver_height'];
  }
  $vars['sweaver_height'] = $sweaver_height;
  // Rest of the form.
  $vars['rest_of_form'] = drupal_render_children($form);
}
