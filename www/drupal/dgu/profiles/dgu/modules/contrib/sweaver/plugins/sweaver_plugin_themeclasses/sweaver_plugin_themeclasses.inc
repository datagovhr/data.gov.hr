<?php
// $Id: sweaver_plugin_themeclasses.inc,v 1.1.2.3.2.9 2010/11/09 09:43:35 swentel Exp $

/**
 * @file
 * Theme classes plugin.
 */
define('SWEAVER_PLUGIN_THEMECLASSES_DEFAULT', 'skinr');

class sweaver_plugin_themeclasses extends sweaver_plugin {

  /**
   * Menu registry.
   */
  public function sweaver_menu(&$weight, $page_arguments, $base) {

    $items = array();

    // Theme classes groups administration.
    $items['admin/config/user-interface/sweaver/themeclasses'] = $base + array(
      'title' => 'Theme styles',
      'page arguments' => array($page_arguments),
      'type' => MENU_LOCAL_TASK,
      'weight' => $weight++,
    );

    return $items;
  }

  /**
   * Frontend form.
   */
  public function sweaver_form() {
    $form = array();

    $class_groups = trim(variable_get('sweaver_themeclasses_groups', SWEAVER_PLUGIN_THEMECLASSES_DEFAULT));
    if (empty($class_groups)) {
      return $form;
    }

    $theme_key = Sweaver::get_instance()->get_theme_key();
    $theme_info = sweaver_get_theme_info($theme_key);
    if (empty($theme_info)) {
      return $form;
    }

    /*$cache = variable_get('sweaver_plugin_themeclasses_'. $theme_key, array());
    if (!empty($cache)) {
      $styles = $cache['styles'];
    }
    else {*/
      $styles = array();
      $groups = explode("\n", $class_groups);
      foreach ($groups as $group) {
        $group = trim($group);
        if (isset($theme_info[$group])) {
          $this->sweaver_get_styles($theme_info[$group], $styles);
        }
      }

      // Cache the stuff.
      //variable_set('sweaver_plugin_themeclasses_'. $theme_key, array('checked' => TRUE, 'styles' => $styles));
    //}

    if (!empty($styles)) {
      $content = t('<h2>Styles</h2>!styles', array('!styles' => implode(' ', $styles)));
    }
    else {
      $content = t('<p>No styles found.</p>');
    }

    $form['sweaver_plugin_themeclasses'] = array(
      '#markup' => $content,
    );

    return $form;
  }


  /**
   * Frontend css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {
    drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_themeclasses/sweaver_plugin_themeclasses.js');
  }

  /**
   * Menu callback.
   */
  public function sweaver_menu_callback() {
    $form = array();

    $form['sweaver_themeclasses_groups'] = array(
      '#type' => 'textarea',
      '#title' => t('Theme groups'),
      '#description' => t('Enter a group which is available in your theme(s) info file. This plugin will try to fetch all classes from it and make them available in a separate tab. Enter one group per line. This is inspired by the skinr way of theming, so we need to find a key called \'class\' to get a list of styles. If you have added new classes and the editor does not pick them up yet, click on submit button to reset the cache.'),
      '#default_value' => variable_get('sweaver_themeclasses_groups', SWEAVER_PLUGIN_THEMECLASSES_DEFAULT),
      '#wysiwyg' => FALSE,
    );

    $form['sweaver_themeclasses_submit'] = array(
      '#type' => 'submit',
      '#value' => t('Save configuration'),
    );

    return $form;
  }

  /**
   * Menu callback submit.
   */
  public function sweaver_menu_callback_submit($form, &$form_state) {
    db_query("DELETE FROM {variable} WHERE name LIKE 'sweaver_plugin_themeclasses_%%'")->execute();
    variable_set('sweaver_themeclasses_groups', $form_state['values']['sweaver_themeclasses_groups']);
    drupal_set_message(t('The configuration options have been saved.'));
  }

  /**
   * Get styles from the group. We look for a key called 'class'.
   */
  public function sweaver_get_styles($theme_info, &$styles) {
    foreach ($theme_info as $key => $value) {
      if (is_array($value) && isset($value['class'])) {
        $label = isset($value['label']) ? $value['label'] : $value['class'];
        $styles[] = '<div class="sweaver-switch-to-style " id="spt-'. $value['class'] .'"><a href="javascript:Drupal.Sweaver.ThemeClasses(\'spt-'. $value['class'] .'\', \'spt-'. strip_tags($value['label']) .'\')">'. strip_tags($value['label']) .'</a></div>';
      }
      if (is_array($value)) {
        $this->sweaver_get_styles($theme_info[$key], $styles);
      }
    }
  }
}
