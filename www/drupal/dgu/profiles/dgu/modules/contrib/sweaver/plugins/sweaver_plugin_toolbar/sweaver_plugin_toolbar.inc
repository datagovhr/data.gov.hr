<?php

/**
 * @file
 * Toolbar plugin.
 */
class sweaver_plugin_toolbar extends sweaver_plugin {

  /**
   * Menu registry.
   */
  public function sweaver_menu(&$weight, $page_arguments, $base) {

    $items = array();

    // Theme classes groups administration.
    $base['access arguments'] = array(array('sweaver_plugin_toolbar', 'sweaver_menu_access_callback', 'use editor'));
    $items['admin/sweaver'] = $base + array(
      'title' => 'Sweaver',
      'page arguments' => array($page_arguments),
      'access callback' => 'sweaver_menu_access_callback',
      'weight' => -6,                  
    );

    return $items;
  }

  /**
   * Frontend css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {
    if (module_exists('overlay')) {
      drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_toolbar/sweaver_plugin_toolbar.js');
    }
  }

  /**
   * The plugin does not really have a page of its own
   */
  public function sweaver_menu_callback() {
     $session = isset($_SESSION['sweaver_plugin_toolbar_session_on'])
        ? $_SESSION['sweaver_plugin_toolbar_session_on']
        : variable_get('sweaver_plugin_toolbar_session_default_on', TRUE);
    $_SESSION['sweaver_plugin_toolbar_session_on'] = !$session;

    // Go back to previous page.
    drupal_goto($_SERVER['HTTP_REFERER']);
  }

  /**
   * Sweaver dependencies.
   */
  public function sweaver_dependencies() {
    return array('toolbar');
  }

  /**
   * Show editor
   */
  public function show_editor() {
    return isset($_SESSION['sweaver_plugin_toolbar_session_on'])
        ? $_SESSION['sweaver_plugin_toolbar_session_on']
        : variable_get('sweaver_plugin_toolbar_session_default_on', TRUE);
  }

  /**
   * Menu access callback.
   */
  public function sweaver_menu_access_callback($args) {
    return user_access($args[0]) && (sweaver_show_editor(FALSE, FALSE) || request_path() == 'admin/sweaver');
  }
}
