<?php
// $Id: sweaver_plugin_fontface.inc,v 1.1.2.2.2.2 2010/11/05 22:02:02 swentel Exp $

/**
 * @file
 * @font-face plugin.
 */
class sweaver_plugin_fontface extends sweaver_plugin {

  /**
   * Sweaver dependencies.
   */
  public function sweaver_dependencies() {
    return array('fontyourface');
  }

  /**
   * Sweaver objects alter.
   */
  public function sweaver_objects_alter(&$objects) {
    $extra_fonts = array();
    $used_fonts = fontyourface_get_fonts();

    foreach ($used_fonts as $font) {
      if (module_exists($font->provider)) {
        $css_function = $font->provider . '_fontyourface_css';
        $font_css = $css_function($font);
        $extra_fonts[$font_css['font-family']] = $font->group_name;
      }
    }

    $objects->property->all['font-family']->property_options += $extra_fonts;
    if (isset($objects->property->enabled['font-family'])) {
      $objects->property->enabled['font-family']->property_options += $extra_fonts;
    }
  }

}
