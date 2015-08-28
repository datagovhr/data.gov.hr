<?php

/**
 * @file
 * Custom CSS plugin.
 */
class sweaver_plugin_advanced extends sweaver_plugin {

  /**
   * Frontend form.
   */
  public function sweaver_form() {

    $current_style = Sweaver::get_instance()->get_current_style();

    $form = array();
    $attributes = array();
    
    $form['#editor_containers'] = array();
    
    $form['#editor_containers']['one']['title'] = 'Watchdog';
    $form['#editor_containers']['one']['content'][] = array('#markup' => '<div id="watchdog">');
    $form['#editor_containers']['one']['content'][] = array(
      '#theme' => 'table',
      '#rows' => array(
        array(
            array('data' => 'List of all changes made in the Style tab'),
            array(
              'data' => '<span class="title delete" onclick="Drupal.Sweaver.deleteAllProperties(); Drupal.Sweaver.writeModifications();">Delete All</span><span class="title hide" onclick="Drupal.Sweaver.cssHider(true);">Hide All</span><span class="title show" onclick="Drupal.Sweaver.cssHider(false);">Show All</span>',
              'class' => array('operations'),
            ),
        ),
      ),
      '#attributes' => array('class' => array('header')),
    );
    $form['#editor_containers']['one']['content'][] = array('#markup' => '<div id="scrollable_area"></div>');
    $form['#editor_containers']['one']['content'][] = array('#markup' => '</div>');
    
    $form['#editor_containers']['two']['title'] = 'Custom css';
    $form['#editor_containers']['two']['content']['sweaver_plugin_custom_css'] = 'sweaver_plugin_custom_css';
    $form['sweaver_plugin_custom_css'] = array(
      '#type' => 'textarea',
      '#rows' => 10,
      '#cols' => 80,
      '#resizable' => FALSE,
      '#wysiwyg' => FALSE,
      '#attributes' => array(
        'class' => array('sweaver-400'),
      ),
      '#default_value' => (isset($current_style->customcss)) ? $current_style->customcss : '',
      '#prefix' => '<div class="form-floater">',
    );
    $form['#editor_containers']['two']['content']['sweaver_plugin_custom_css_button'] = 'sweaver_plugin_custom_css_button';
    $form['sweaver_plugin_custom_css_button'] = array(
      '#type' => 'button',
      '#value' => t('Apply'),
      '#suffix' => '</div>',
    );
    return $form;
  }
  
  /**
   * Frontend form render.
   */
  public function sweaver_form_render(&$vars, &$form, $plugin) {

    $name = $plugin['name'];
    $vars['tabs'][$name]['#tab_name'] = $form[$name]['#tab_name'];
    $vars['tabs_data'][$name]['#tab_description'] = $form[$name]['#tab_description'];

    $output = '';

    $output .= '<div id="sweaver-advanced" class="clearfix">';

    // Containers.
    $vertical_tabs = '';
    $containers = '';

    foreach ($form[$name]['form']['#editor_containers'] as $key => $container_value) {
      // Set the first tab as active by default.
      $tab_class = '';
      if ($key == 'one') {
        $tab_class = 'class="active"';
      }

      // Combine all vertical tabs.
      $vertical_tabs .= '<div id="tab-'. $key .'" class="vertical-tab"><a href="#" '. $tab_class .'>'. $container_value['title'] .'</a></div>';

      // Combine all properties in containers.
      $containers .= '<div id="container-'. $key .'" class="container-wrapper">';
      foreach ($container_value['content'] as $sub_key => $field) {
        if (is_int($sub_key))
            $containers .= drupal_render($field);
        else
            $containers .= drupal_render($form[$name]['form'][$field]);
      }
      $containers .= '</div>';
    }

    $output .= '<div class="vertical-tabs">' . $vertical_tabs . '</div>';
    $output .= '<div class="vertical-content">' . $containers . '</div>';

    $output .= '</div>';

    $vars['tabs_data'][$name]['content'] = $output;
  }
  
  
  /**
   * Frontend form submit handler.
   */
  function sweaver_form_submit($form, &$form_state) {
    if (isset($form_state['values']['sweaver_plugin_custom_css'])) {
        $clicked_button = $form_state['clicked_button']['#value'];
        if (($clicked_button == t('Save and continue') || $clicked_button == t('Save and publish') || $clicked_button == t('Publish style')) && isset($form_state['style_id'])) {
          db_query("UPDATE {sweaver_style_draft} set customcss = :customcss WHERE style_id = :style_id", array(':customcss' => $form_state['values']['sweaver_plugin_custom_css'], ':style_id' => $form_state['style_id']));
          if ($form_state['publish']) {
            db_query("UPDATE {sweaver_style} set customcss = :customcss WHERE style_id = :style_id", array(':customcss' => $form_state['values']['sweaver_plugin_custom_css'], ':style_id' => $form_state['style_id']));
          }
        }
    }
  }

  /**
   * Frontend css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {
    drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_advanced/sweaver_plugin_customcss.js');
    drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_advanced/sweaver_plugin_watchdog.js');
  }
}
