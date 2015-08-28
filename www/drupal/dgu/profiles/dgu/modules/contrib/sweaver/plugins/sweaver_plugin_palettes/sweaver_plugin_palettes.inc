<?php
// $Id: sweaver_plugin_palettes.inc,v 1.1.4.9 2010/11/08 15:56:32 jyve Exp $

/**
 * @file
 * Palettes plugin.
 */
class sweaver_plugin_palettes extends sweaver_plugin {

  /**
   * Frontend css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {
    drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_palettes/sweaver_plugin_palettes.js');
  }

  /**
   * Preprocess page function.
   */
  function sweaver_preprocess_page(&$vars) {
    // Get active palette.
    $current_style = Sweaver::get_instance()->get_current_style();
    $active_palette = isset($current_style->palette) ? $current_style->palette : '';

    // Add the correct stylesheet if an active palette is found.
    if (!empty($active_palette)) {
      $theme_key = Sweaver::get_instance()->get_theme_key();
      $info = db_query("SELECT info FROM {system} WHERE name = :theme AND type ='theme'", array(':theme' => $theme_key))->fetchField();
      $theme_info = unserialize($info);

      if (isset($theme_info['sweaver']['palettes'][$active_palette])) {
        $css = drupal_get_path('theme', $theme_key) . '/' . $theme_info['sweaver']['palettes'][$active_palette]['file'];
        $settings = array(
          'weight' => 1001,
          'preprocess' => TRUE,
          'group' => CSS_THEME,
        );
        drupal_add_css($css, $settings);
      }
    }
  }

  /**
   * Frontend form.
   */
  public function sweaver_form() {

    $current_style = Sweaver::get_instance()->get_current_style();
    $active_palette = isset($current_style->palette) ? $current_style->palette : '';

    global $base_path;
    $form = array();
    $containers = '';
    $theme_key = Sweaver::get_instance()->get_theme_key();
    $theme_info = sweaver_get_theme_info($theme_key);

    if (isset($theme_info['sweaver']['palettes'])) {

      // Combine all properties in containers.
      $i = 0;
      $container_count = 1;
      $container_total = ceil(count($theme_info['sweaver']['palettes'])/5);

      $containers .= '<div class="container-wrapper">';

      foreach ($theme_info['sweaver']['palettes'] as $key => $palette) {
        if ($i == 0) {
          // Add first/last classes to the containers.
          $container_class = '';
          if ($container_count == 1) {
            $container_class .= ' container-first';
          }
          if ($container_total == $container_count) {
            $container_class .= ' container-last';
          }
          $containers .= '<div class="container '. $container_class .'"><div class="container-inner">';
        }
        // Add the actual content.
        $extra_class = ($active_palette == $key ? ' active' : '');
        $containers .= '<div id="palette-' . $key .'" class="colors clearfix'. $extra_class .'">';

        foreach ($palette['colors'] as $color) {
          $containers .= '<div class="color" style="background-color:'. $color .' !important">'. $color .'</div>';
        }
        $containers .= '<div class="name">'. $palette['name'] .'</div>';

        // Add a hidden field with the path to the css file.
        $containers .= '<div class="file" style="display: none;">'. $base_path . drupal_get_path('theme', $theme_key) .'/'. $palette['file'] .'</div>';

        // Add a hidden field with the key.
        $containers .= '<div class="key" style="display: none;">'. $key .'</div>';
        $containers .= '</div>';
        $i++;
        // close the container div if necessary.
        if ($i == 5) {
          $containers .= '</div></div>';
          $container_count++;
          $i = 0;
        }
      }
      if ($i != 0) {
        $containers .= '</div></div>';
      }
      $containers .= '</div>';

      // Add a hidden field that stores the active key to be saved.
      $form['sweaver_plugin_palette'] = array(
        '#type' => 'hidden',
        '#default_value' => $active_palette ? $active_palette : '',
      );

      $form['markup'] = array(
        '#markup' => $containers,
      );
    }

    return $form;
  }

  /**
   * Frontend form submit handler.
   */
  function sweaver_form_submit($form, &$form_state) {
    $clicked_button = $form_state['clicked_button']['#value'];

    if (($clicked_button == t('Save and continue') || $clicked_button == t('Save and publish') || $clicked_button == t('Publish style')) && isset($form_state['style_id']) && isset($form_state['values']['sweaver_plugin_palette'])) {
      db_query("UPDATE {sweaver_style_draft} set palette = :palette WHERE style_id = :style_id", array(':palette' => $form_state['values']['sweaver_plugin_palette'], ':style_id' => $form_state['style_id']));
      if ($form_state['publish']) {
        db_query("UPDATE {sweaver_style} set palette = :palette WHERE style_id = :style_id", array(':palette' => $form_state['values']['sweaver_plugin_palette'], ':style_id' => $form_state['style_id']));
      }
    }
  }
}