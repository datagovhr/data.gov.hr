<?php
// $Id: sweaver_plugin_kb.inc,v 1.1.4.6 2010/11/09 13:50:26 swentel Exp $

/**
 * @file
 * Key bindings plugin.
 */
class sweaver_plugin_kb extends sweaver_plugin {

  /**
   * Sweaver dependencies.
   */
  public function sweaver_dependencies() {
    if (!variable_get('sweaver_plugin_status_sweaver_plugin_styles', FALSE)) {
      return array('Manage styles');
    }
    return array();
  }

  /**
   * Menu registry.
   */
  public function sweaver_menu(&$weight, $page_arguments, $base) {
    $items = array();

    $items['admin/config/user-interface/sweaver/kb'] = $base + array(
      'title' => 'Keyboard',
      'page arguments' => array($page_arguments),
      'type' => MENU_LOCAL_TASK,
      'weight' => $weight++,
    );

    return $items;
  }

  /**
   * Frontend css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {
    drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_kb/jquery.hotkeys.js');
    drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_kb/sweaver_plugin_kb.js');
    $bindings = $this->sweaver_kb_bindings();
    $binding_options = $this->sweaver_kb_binding_options();

    foreach ($bindings as $key => $value) {

      // Do not add when a certain variable isn't set. (eg delete tab)
      if (isset($value['variable']) && !variable_get($value['variable'], FALSE)) {
        continue;
      }

      // Get keyboard key. Make sure it's not empty.
      $keyboard_key = variable_get('sweaver_plugin_kb_'. $key, $value['default']);
      if (!empty($keyboard_key)) {
        $inline_settings['sweaver']['kb'][$key] = array(
          'kb_code' => $keyboard_key,
          'kb_button' => $binding_options[$keyboard_key],
          'element' => isset($value['element']) ? $value['element'] : '',
        );
      }
    }
  }

  /**
   * Keyboard bindings settings form.
   */
  public function sweaver_menu_callback() {
    $form = array();
    $bindings = $this->sweaver_kb_bindings();
    $binding_options = $this->sweaver_kb_binding_options();

    $form['info'] = array(
      '#markup' => t('Select keys for every event possible. Note, there is no validation when saving this form, so make sure every event has a unique key.'),
    );

    foreach ($bindings as $key => $value) {
      $form['sweaver_plugin_kb_'. $key] = array(
        '#type' => 'select',
        '#options' => $binding_options,
        '#title' => $value['title'],
        '#default_value' => variable_get('sweaver_plugin_kb_'. $key, $value['default']),
      );
    }

    return system_settings_form($form);
  }

  /**
   * Possible keyboard bindings.
   */
  public function sweaver_kb_bindings() {
    $bindings = array(
      'save' => array(
        'title' => t('Save style popup'),
        'default' => '83',
        'element' => '.save-style-popup',
        'double' => TRUE,
      ),
      'load' => array(
        'title' => t('Load style popup'),
        'default' => '76',
        'element' => '.load-style-popup',
        'double' => TRUE,
      ),
      'publish' => array(
        'title' => t('Publish style popup'),
        'default' => '80',
        'element' => '.publish-style-popup',
        'double' => TRUE,
      ),
      'delete' => array(
        'title' => t('Delete style popup'),
        'default' => '68',
        'variable' => 'sweaver_styles_delete_tab',
        'element' => '.delete-style-popup',
        'double' => TRUE,
      ),
      'close' => array(
        'title' => t('Close popup'),
        'default' => '27',
        'double' => FALSE,
      ),
    );

    return $bindings;
  }

  /**
   * All possible keyboard bindings.
   */
  public function sweaver_kb_binding_options() {
    return array(
      '',
      '27' => 'esc',
      '48' => '0',
      '49' => '1',
      '50' => '2',
      '51' => '3',
      '52' => '4',
      '53' => '5',
      '54' => '6',
      '55' => '7',
      '56' => '8',
      '57' => '9',
      '65' => 'a',
      '66' => 'b',
      '67' => 'c',
      '68' => 'd',
      '69' => 'e',
      '70' => 'f',
      '71' => 'g',
      '72' => 'h',
      '73' => 'i',
      '74' => 'j',
      '75' => 'k',
      '76' => 'l',
      '77' => 'm',
      '78' => 'n',
      '79' => 'o',
      '80' => 'p',
      '81' => 'q',
      '82' => 'r',
      '83' => 's',
      '84' => 't',
      '85' => 'u',
      '86' => 'v',
      '87' => 'w',
      '88' => 'x',
      '89' => 'y',
      '90' => 'z',
    );
  }
}
