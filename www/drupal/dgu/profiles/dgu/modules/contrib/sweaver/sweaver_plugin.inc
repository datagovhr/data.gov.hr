<?php

/**
 * @file
 * Abstract Base class for a sweaver plugin.
 *
 * Public methods:
 *
 * - sweaver_init().
 *     Add initial logic, can be various tasks or preparation of data.
 * - sweaver_menu().
 *     Add menu items.
 * - sweaver_menu_callback().
 *     Menu callback.
 * - sweaver_menu_callback_validate().
 *     Validator for the menu callback.
 * - sweaver_menu_callback_submit().
 *     Menu callback submit.
 * - sweaver_theme().
 *     Add theme registry items.
 * - sweaver_dependencies().
 *     Define dependencies.
 * - sweaver_objects_alter().
 *     Alter the sweaver object.
 * - sweaver_form_css_js().
 *     Loads and includes extra javascript and css files.
 * - sweaver_form_render().
 *     Renders the frontend manipulation form.
 * - sweaver_form().
 *     Loads the frontend manipulation form for the plugin.
 * - sweaver_form_submit().
 *     Submit handler that can perform extra save actions if needed.
 * - [callback_method]
 *     Swappable method that can be implemented and invoked.
 */
abstract class sweaver_plugin {

  /**
   * Helper function render the popups.
   */
  protected function sweaver_popups_render(&$vars, &$form, $name) {
    foreach ($form[$name]['form']['#popups'] as $key => $form_key) {
      $vars['sweaver_popup'] .= drupal_render($form[$name]['form'][$form_key]);
    }
  }

  /**
   * Init function.
   */
  public function sweaver_init() {
    // Initial things to do.
  }

  /**
   * Preprocess page function.
   */
  public function sweaver_preprocess_page(&$vars) {
    // Initial things to do.
  }

  /**
   * Sweaver dependencies.
   */
  public function sweaver_dependencies() {
    return array();
  }

  /**
   * Sweaver objects alter.
   */
  public function sweaver_objects_alter(&$objects) { 
    // Alter the objects if you want to.
  }

  /**
   * Images handler.
   */
  public  function sweaver_images_handler(&$images) {
    // Handles image. Is this neccessary here?
  }

  /**
   * Menu registry.
   */
  public function sweaver_menu(&$weight, $page_arguments, $base) {
    // Hook method to add sweaver menu items.
    return array();
  }

  /**
   * Menu callback.
   */
  public function sweaver_menu_callback() {
    // Add in some menu links or tabs.
  }

  /**
   * Menu callback validate.
   */
  public function sweaver_menu_callback_validate($form, &$form_state) {
    // Handles image. Is this neccessary here?
  }

  /**
   * Menu callback submit.
   */
  public function sweaver_menu_callback_submit($form, &$form_state) {
    // Handles image. Is this neccessary here?
  }

  /**
   * Theme registry.
   */
  public function sweaver_theme() {
    // Adds to the theme registry.
    return array();
  }

  /**
   * Sweaver css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {
    // Load some extra javascript and/or css files.
  }

  /**
   * Sweaver form.
   */
  public function sweaver_form() {
    // create a managing form.
  }

  /**
   * Sweaver submit handler.
   */
  public function sweaver_form_submit($form, &$form_state) {
    // Submit handler for the managing form.
  }

  /**
   * Return false to not show editor.
   */
  public function show_editor() {
  }

  /**
   * Return true to allow access and false to deny.
   */
  public function sweaver_menu_access_callback($args) {
  }

  /**
   * Sweaver form render.
   */
  public function sweaver_form_render(&$vars, &$form, $plugin) {
    $name = $plugin['name'];
    if (isset($form[$name])) {

      if (isset($form[$name]['form']['#popups'])) {
        $this->sweaver_popups_render($vars, $form, $name);
      }

      if (isset($form[$name]['#tab_name'])) {
        $vars['tabs'][$name]['#tab_name'] = $form[$name]['#tab_name'];
      }
      $vars['tabs_data'][$name]['#tab_description'] = $form[$name]['#tab_description'];
      $vars['tabs_data'][$name]['content'] = drupal_render($form[$name]['form']);
    }
  }

}

