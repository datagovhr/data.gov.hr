<?php
// $Id: sweaver_plugin_themeswitch.inc,v 1.1.2.4.2.8 2010/11/05 23:54:07 swentel Exp $

/**
 * @file
 * Themeswitch plugin.
 */
class sweaver_plugin_themeswitch extends sweaver_plugin {

  /**
   * Menu registry.
   */
  public function sweaver_menu(&$weight, $page_arguments, $base) {

    $items = array();

    // Theme classes groups administration.
    $base['access arguments'] = array('use editor');
    $items['sweaver_themeswitch'] = $base + array(
      'title' => 'Theme switch',
      'page arguments' => array($page_arguments),
      'type' => MENU_CALLBACK,
      'weight' => $weight++,
    );

    return $items;
  }

  /**
   * Frontend form.
   */
  public function sweaver_form() {
    $form = array();
    $content = '';
    $no_image = drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_themeswitch/no_screenshot.png';

    $theme_key = Sweaver::get_instance()->get_theme_key();
    $number_of_themes = 0;
    $themes = sweaver_get_all_themes();
    foreach ($themes as $theme) {

      if (isset($theme->info['screenshot']) && file_exists($theme->info['screenshot'])) {
        $image_file = $theme->info['screenshot'];
      }
      else {
        $image_file = $no_image;
      }

      if ($theme_key != $theme->name) {
        $switch_description = t('Switch to @theme', array('@theme' => $theme->info['name']));
        $image = sweaver_theme_image($image_file, $switch_description, $switch_description, array('width' => '150', 'height' => '90'), FALSE);
        $image = l($image, 'sweaver_themeswitch/'. $theme->name, array('alias' => TRUE, 'html' => TRUE, 'query' => drupal_get_destination()));
        $content .= '<div class="selected-image">'. $image;
      }
      else {
        $switch_description = t('This theme is currently selected');
        $image = sweaver_theme_image($image_file, $switch_description, $switch_description, array('width' => '150', 'height' => '90'), FALSE);
        $content .= '<div class="selected-image selected-image-default">'. $image;
      }
      $number_of_themes++;

      $content .= '<br />'. check_plain($theme->info['name']);

      $content .= '</div>';
    }

    $form['markup'] = array(
      '#markup' => '<div id="themeswitch-pane"><div id="themeswitch-content">'. $content .'</div><div class="scroll-bar-wrap"><div class="scroll-bar"></div></div></div>',
    );

    return $form;
  }

  /**
   * Frontend form submit handler.
   */
  public function sweaver_form_submit($form, &$form_state) {
    if ($form_state['clicked_button']['#value'] == t('Publish style') && isset($form_state['style_id'])) {
      $theme_key = $form['#current_theme'];
      variable_set('theme_default', $theme_key);
    }
  }

  /**
   * Frontend css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {
    drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_themeswitch/sweaver_plugin_themeswitch.js', 'module');
  }

  /**
   * Frontend themeswitch.
   */
  public function sweaver_menu_callback() {
    $theme = arg(1);
    $theme_default = variable_get('theme_default', 'garland');

    $all_themes = sweaver_get_all_themes();
    if (!empty($theme) && isset($all_themes[$theme]) && $all_themes[$theme]->status == 1) {

      if ($theme != $theme_default) {
        sweaver_session(NULL, 'sweaver_theme', TRUE);
        sweaver_session($theme, 'sweaver_theme');
      }
      else {
        // Reset session variable because it's the default.
        sweaver_session(NULL, 'sweaver_theme', TRUE);
      }

      // Let other modules act on the themeswitch.
      $arguments = array(
        'switched_theme' => $theme,
        'default_theme' => $theme_default,
      );
      module_invoke_all('sweaver_action', 'theme_switch', $arguments);

      sweaver_session(t('You have switched to @switched_theme.', array('@switched_theme' => $all_themes[$theme]->info['name'])));
    }

    // Go back to previous page.
    drupal_goto();
  }
}
