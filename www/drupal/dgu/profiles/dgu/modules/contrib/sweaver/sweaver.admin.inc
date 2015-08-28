<?php

/**
 * @file
 * Administrative functions for sweaver plugins.
 */

/**
 * Plugins form.
 */
function sweaver_plugin_config_plugins() {
  $form = array();
  $weight = 100;
  $form['#tree'] = TRUE;
  $form['#plugins'] = array();
  $form['#theme'] = 'sweaver_plugin_config_plugins';
  $plugins_order = variable_get('sweaver_plugins_weight', array());
  cache_clear_all('plugins:sweaver:plugins', 'cache');
  cache_clear_all('sweaver_plugins', 'cache');
  drupal_add_css(drupal_get_path('module', 'sweaver') .'/sweaver_plugin.admin.css');

  $sweaver = Sweaver::get_instance();
  foreach ($sweaver->get_plugins_registry(FALSE) as $plugin_name => $plugin) {
    $sweaver_plugin = $sweaver->get_plugin($plugin_name, FALSE);

    $default_weight = isset($plugins_order[$plugin_name]) ? $plugins_order[$plugin_name] : $weight++;
    $form['#plugins'][$plugin_name] = $default_weight;

    // Status - editor can not be disabled.
    $status = variable_get('sweaver_plugin_status_'. $plugin_name, FALSE);
    if ($plugin_name == 'sweaver_plugin_editor') {
      $form[$plugin_name]['status'] = array(
        '#type' => 'checkbox',
        '#value' => 1,
        '#access' => FALSE,
      );
    }
    else {
      $missing = array();
      $can_be_enabled = TRUE;
      $dependencies = $sweaver_plugin->sweaver_dependencies();
      if (!empty($dependencies)) {
        foreach ($dependencies as $module) {
          if (!module_exists($module)) {
            $can_be_enabled = FALSE;
            $missing[] = $module;
          }
        }
      }
      $form[$plugin_name]['status'] = array(
          '#type' => 'checkbox',
          '#default_value' => $status,
      );
      if (!$can_be_enabled) {
        $form[$plugin_name]['status']['#disabled'] = TRUE;
        $form[$plugin_name]['status']['#value'] = 0;
        $form[$plugin_name]['status']['#description'] = t('Following modules or plugins are disabled or missing: @module', array('@module' => implode(', ', $missing)));
      }
    }

    // Markup.
    $form[$plugin_name]['name'] = array(
      '#markup' => isset($plugin['tab']) ? $plugin['tab'] : drupal_ucfirst($plugin_name),
    );
    $form[$plugin_name]['weight'] = array(
      '#type' => 'weight',
      '#delta' => 50,
      '#attributes' => array(
        'class' => array('plugin-weight'),
      ),
      '#default_value' => $default_weight,
    );
  }

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save configuration'),
  );

  return $form;
}

/**
 * Plugins form submit callback.
 */
function sweaver_plugin_config_plugins_submit(&$form, &$form_state) {
  // Reset cookies.
  setcookie('sweaver_active_tab', 'sweaver_plugin_editor');

  $plugins_order = array();
  foreach ($form['#plugins'] as $plugin_name => $weight) {
    variable_set('sweaver_plugin_status_'. $plugin_name, $form_state['values'][$plugin_name]['status']);
    $plugins_order[$plugin_name] = $form_state['values'][$plugin_name]['weight'];
  }
  variable_set('sweaver_plugins_weight', $plugins_order);
  drupal_flush_all_caches();
  variable_set('menu_rebuild_needed', TRUE);

  drupal_set_message(t('The configuration options have been saved.'));
  $form_state['redirect'] = 'admin/config/user-interface/sweaver/plugins';
}