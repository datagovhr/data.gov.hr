<?php

/**
 * @file
 * Registry for Sweaver.
 */

/**
 * Menu items.
 */
function _sweaver_menu() {
  $weight = 0;
  $items = array();

  // The sweaver plugins administration.
  $items['admin/config/user-interface/sweaver/plugins'] = array(
    'title' => 'Plugins',
    'type' => MENU_LOCAL_TASK,
    'weight' => 2,
    'access arguments' => array('configure sweaver'),
    'page callback' => 'drupal_get_form',
    'page arguments' => array('sweaver_plugin_config_plugins'),
    'file' => 'sweaver.admin.inc'
  );

  $base = array(
    'access arguments' => array('configure sweaver'),
    'page callback' => 'sweaver_menu_callback',
  );

  $sweaver = Sweaver::get_instance();
  foreach (array_keys($sweaver->get_plugins_registry(TRUE)) as $plugin_name) {
    $sweaver_plugin = $sweaver->get_plugin($plugin_name);
    $page_arguments = array(
      'plugin' => $plugin_name,
    );
    $item = $sweaver_plugin->sweaver_menu($weight, $page_arguments, $base);

    $items += $item;
  }
  return $items;
}

/**
 * Theming functions.
 */
function _sweaver_theme() {

  $skin = variable_get('sweaver_skin', SWEAVER_SKIN);
  $theme_functions = array(
    'sweaver_plugin' => array(
      'template' => $skin,
      'file' => $skin . '.theme.inc',
      'path' => drupal_get_path('module', 'sweaver') .'/skins/'. $skin,
      'render element' => 'form',
    ),
    'sweaver_plugin_config_plugins' => array(
      'template' => 'sweaver-plugin-config-plugins',
      'file' => 'sweaver_plugin.theme.inc',
      'path' => drupal_get_path('module', 'sweaver'),
      'render element' => 'form',
    ),
  );

  $sweaver = Sweaver::get_instance();
  foreach (array_keys($sweaver->get_plugins_registry(TRUE)) as $plugin_name) {
    $sweaver_plugin = $sweaver->get_plugin($plugin_name);
    $theme_function = $sweaver_plugin->sweaver_theme();
    $theme_functions += $theme_function;
  }

  return $theme_functions;
}

/**
 * Sweaver plugins.
 */
function _sweaver_sweaver_plugins() {
  $plugins = array();

  $plugins['sweaver_plugin_editor'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_editor',
      'file' => 'sweaver_plugin_editor.inc',
      'class' => 'sweaver_plugin_editor',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Style'),
    'tab_description' => t('Click on the element you want to theme.'),
  );
  $plugins['sweaver_plugin_styles'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_styles',
      'file' => 'sweaver_plugin_styles.inc',
      'class' => 'sweaver_plugin_styles',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Manage styles'),
  );
  $plugins['sweaver_plugin_palettes'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_palettes',
      'file' => 'sweaver_plugin_palettes.inc',
      'class' => 'sweaver_plugin_palettes',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Palettes'),
    'tab_description' => t('Change all settings in one click'),
  );
  $plugins['sweaver_plugin_advanced'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_advanced',
      'file' => 'sweaver_plugin_advanced.inc',
      'class' => 'sweaver_plugin_advanced',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Advanced'),
    'tab_description' => t('Advanced options for managing css'),
  );  
  $plugins['sweaver_plugin_images'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_images',
      'file' => 'sweaver_plugin_images.inc',
      'class' => 'sweaver_plugin_images',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Images'),
    'tab_description' => t('Upload images to use as a background image.'),
  );
  $plugins['sweaver_plugin_themeswitch'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_themeswitch',
      'file' => 'sweaver_plugin_themeswitch.inc',
      'class' => 'sweaver_plugin_themeswitch',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Switch theme'),
    'tab_description' => t('Switch and style another theme.'),
  );
  $plugins['sweaver_plugin_themesettings'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_themesettings',
      'file' => 'sweaver_plugin_themesettings.inc',
      'class' => 'sweaver_plugin_themesettings',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Theme settings'),
    'tab_description' => t('Configure the settings for this theme.'),
  );
  $plugins['sweaver_plugin_themeclasses'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_themeclasses',
      'file' => 'sweaver_plugin_themeclasses.inc',
      'class' => 'sweaver_plugin_themeclasses',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Theme styles'),
    'tab_description' => t('Select an item - if any - to style it. Clicking will switch to the style editor form.'),
  );
  $plugins['sweaver_plugin_fontface'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_fontface',
      'file' => 'sweaver_plugin_fontface.inc',
      'class' => 'sweaver_plugin_fontface',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Font face'),
  );
  $plugins['sweaver_plugin_kb'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_kb',
      'file' => 'sweaver_plugin_kb.inc',
      'class' => 'sweaver_plugin_kb',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Key bindings'),
  );
  $plugins['sweaver_plugin_toolbar'] = array(
    'handler' => array(
      'path' => drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_toolbar',
      'file' => 'sweaver_plugin_toolbar.inc',
      'class' => 'sweaver_plugin_toolbar',
      'parent' => 'sweaver_plugin',
    ),
    'tab' => t('Toolbar'),
  );

  return $plugins;
}

/**
 * Default selectors.
 */
function _sweaver_default_sweaver_selector() {
  $selectors = array();

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'body';
  $selector->description = t('Body');
  $selector->selector_selector = 'body';
  $selector->selector_highlight = FALSE;
  $selector->weight = 0;
  $selectors['body'] = $selector;
  
  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'menu';
  $selector->description = t('Menu');
  $selector->selector_selector = '.menu';
  $selector->selector_highlight = TRUE;
  $selector->weight = 50;
  $selectors['menu'] = $selector;
  
  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'navigation';
  $selector->description = t('Navigation');
  $selector->selector_selector = '.navigation';
  $selector->selector_highlight = TRUE;
  $selector->weight = 50;
  $selectors['navigation'] = $selector;
  
  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'read_more';
  $selector->description = t('Read more');
  $selector->selector_selector = '.node-readmore';
  $selector->selector_highlight = TRUE;
  $selector->weight = 51;
  $selectors['read_more'] = $selector;
  
  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'h1';
  $selector->description = t('Heading 1');
  $selector->selector_selector = 'h1';
  $selector->selector_highlight = FALSE;
  $selector->weight = 52;
  $selectors['h1'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'h2';
  $selector->description = t('Heading 2');
  $selector->selector_selector = 'h2';
  $selector->selector_highlight = FALSE;
  $selector->weight = 53;
  $selectors['h2'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'h3';
  $selector->description = t('Heading 3');
  $selector->selector_selector = 'h3';
  $selector->selector_highlight = FALSE;
  $selector->weight = 54;
  $selectors['h3'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'li';
  $selector->description = t('a list item');
  $selector->selector_selector = 'li';
  $selector->selector_highlight = FALSE;
  $selector->weight = 55;
  $selectors['li'] = $selector;
  
  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'link';
  $selector->description = t('a link');
  $selector->selector_selector = 'a';
  $selector->selector_highlight = FALSE;
  $selector->weight = 56;
  $selectors['link'] = $selector;
  
  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'ol';
  $selector->description = t('an ordered list');
  $selector->selector_selector = 'ol';
  $selector->selector_highlight = FALSE;
  $selector->weight = 57;
  $selectors['ol'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'p';
  $selector->description = t('a paragraph');
  $selector->selector_selector = 'p';
  $selector->selector_highlight = FALSE;
  $selector->weight = 58;
  $selectors['p'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'ul';
  $selector->description = t('an unordered list');
  $selector->selector_selector = 'ul';
  $selector->selector_highlight = FALSE;
  $selector->weight = 59;
  $selectors['ul'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'form';
  $selector->description = t('a form');
  $selector->selector_selector = 'form';
  $selector->selector_highlight = FALSE;
  $selector->weight = 60;
  $selectors['form'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'label';
  $selector->description = t('a label');
  $selector->selector_selector = 'label';
  $selector->selector_highlight = FALSE;
  $selector->weight = 61;
  $selectors['label'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'input';
  $selector->description = t('an input field');
  $selector->selector_selector = '.form-text';
  $selector->selector_highlight = FALSE;
  $selector->weight = 62;
  $selectors['input'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'textarea';
  $selector->description = t('a textarea');
  $selector->selector_selector = '.form-textarea';
  $selector->selector_highlight = FALSE;
  $selector->weight = 63;
  $selectors['textarea'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'submit';
  $selector->description = t('a submit button');
  $selector->selector_selector = '.form-submit';
  $selector->selector_highlight = FALSE;
  $selector->weight = 64;
  $selectors['submit'] = $selector;
  
  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'allids';
  $selector->description = t('All other id\'s');
  $selector->selector_selector = '';
  $selector->selector_highlight = FALSE;
  $selector->weight = 97;
  $selectors['allids'] = $selector;
  
  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'allclasses';
  $selector->description = t('All other classes');
  $selector->selector_selector = '';
  $selector->selector_highlight = FALSE;
  $selector->weight = 98;
  $selectors['allclasses'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'alltags';
  $selector->description = t('All other tags');
  $selector->selector_selector = '';
  $selector->selector_highlight = FALSE;
  $selector->weight = 99;
  $selectors['alltags'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'span';
  $selector->description = t('an item');
  $selector->selector_selector = 'span';
  $selector->selector_highlight = FALSE;
  $selector->weight = 100;
  $selectors['span'] = $selector;

  $selector = new stdClass;
  $selector->api_version = 1;
  $selector->disabled = FALSE;
  $selector->name = 'div';
  $selector->description = t('a region');
  $selector->selector_selector = 'div';
  $selector->selector_highlight = FALSE;
  $selector->weight = 100;
  $selectors['div'] = $selector;

  return $selectors + sweaver_load_theme_selectors();
}

/**
 * Default properties.
 */
function _sweaver_default_sweaver_property() {
  $propertys = array();

  // Font family.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'font-family';
  $property->description = t('Font family');
  $property->property = 'font-family';
  $property->property_parent = '';
  $property->property_type = 'select';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    '' => 'Theme default',
    'Arial, Helvetica,Sans-Serif' => 'Arial',
    '\'Arial Black\',Sans-Serif' => 'Arial Black',
    '\'Comic Sans MS\',Cursive' => 'Comic Sans MS',
    '\'Courier New\',Courier,Monospace' => 'Courier',
    'Georgia,Serif' => 'Georgia',
    'Helvetica,Arial,Sans-Serif' => 'Helvetica',
    'Impact,Charcoal,Sans-Serif' => 'Impact',
    '\'Lucida Sans\',\'Lucida Grande\',Sans-Serif' => 'Lucida',
    '\'Palatino Linotype\',Palatino,Serif' => 'Palatino',
    'Tahoma,Geneva,Sans-Serif' => 'Tahoma',
    '\'Times New Roman\',Times,Serif' => 'Times New Roman',
    '\'Trebuchet\',Helvetica,Sans-Serif' => 'Trebuchet',
    'Verdana,Geneva,Sans-Serif' => 'Verdana',
  );
  $property->css_prefix = '<fieldset>';
  $property->css_suffix = '</fieldset>';
  $propertys['font-family'] = $property;  
  
  // Font size group
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'font-properties-wrapper';
  $property->description = t('Font properties');
  $property->property = '';
  $property->property_parent = '';
  $property->property_type = 'parent';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    '#attributes' => array(
      'id' => 'sweaver-font'
    ),
    '#rows' => array(
      array(
        array(
          'data' => '{font-size}',
        ),
        array(
          'data' => '{line-height}',
          'class' => 'close-container',
        ),
        array(
          'data' => '{color}',
          'class' => array('open-container', 'close-container'),
        ),
        array(
          'data' => '{font-style}',
          'class' => 'open-container',
        ),
        array(
          'data' => '{font-weight}',
          'class' => 'close-container',
        ),
        array(
          'data' => '{text-decoration}',
          'class' => array('open-container', 'close-container'),
        ),
        array(
          'data' => '{text-align}',
          'class' => 'open-container',
        ),
      ),
    )
  );
  $propertys['font-properties-wrapper'] = $property;
  
  // Font size
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'font-size';
  $property->description = t('Size');
  $property->property = 'font-size';
  $property->property_parent = 'font-properties-wrapper';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 1;
  $property->property_slider_max = 75;
  $property->css_prefix = '<div id="logo-font-size" class="editor_logos"></div>';
  $property->css_suffix = '';
  $property->property_options = array();
  $propertys['font-size'] = $property;
  
  // Line height
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'line-height';
  $property->description = t('Line height');
  $property->property = 'line-height';
  $property->property_parent = 'font-properties-wrapper';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 1;
  $property->property_slider_max = 100;
  $property->css_prefix = '<div id="logo-line-height" class="editor_logos"></div>';
  $property->css_suffix = '';
  $property->property_options = array();
  $propertys['line-height'] = $property;
  
  // Color.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'color';
  $property->description = t('Font color');
  $property->property = 'color';
  $property->property_parent = 'font-properties-wrapper';
  $property->property_type = 'color';
  $property->property_prefix = '#';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array();
  $propertys['color'] = $property;
  
  // Font style.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'font-style';
  $property->description = t('Font style');
  $property->property = 'font-style';
  $property->property_parent = 'font-properties-wrapper';
  $property->property_type = 'checkbox';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    'normal' => false, // Not checked
    'italic' => true,
  );
  $propertys['font-style'] = $property;

  // Font weight.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'font-weight';
  $property->description = t('Font weight');
  $property->property = 'font-weight';
  $property->property_parent = 'font-properties-wrapper';
  $property->property_type = 'checkbox';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    'normal' => false,
    'bold' => true,
    '700' => true,
    '800' => true,
    '900' => true,
  );
  $propertys['font-weight'] = $property;
  
  // Text-decoration.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'text-decoration';
  $property->description = t('Text decoration');
  $property->property = 'text-decoration';
  $property->property_parent = 'font-properties-wrapper';
  $property->property_type = 'radio';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    'none' => t('None'),
    'underline' => t('Underline'),
    'line-through' => t('Line through'),
  );
  $propertys['text-decoration'] = $property;

  // Text alignment.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'text-align';
  $property->description = t('Text alignment');
  $property->property = 'text-align';
  $property->property_parent = 'font-properties-wrapper';
  $property->property_type = 'radio';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    'left' => t('Left'),
    'center' => t('Center'),
    'right' => t('Right'),
    'justify' => t('Justified'),
  );
  $propertys['text-align'] = $property;

  // Background.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'background-color';
  $property->description = t('Color');
  $property->property = 'background-color';
  $property->property_parent = '';
  $property->property_type = 'color';
  $property->property_prefix = '#';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array();
  $propertys['background-color'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'background-image';
  $property->description = t('Image');
  $property->property = 'background-image';
  $property->property_parent = '';
  $property->property_type = 'image';
  $property->property_prefix = 'url(';
  $property->property_suffix = ')';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array();
  $propertys['background-image'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'background-repeat';
  $property->description = t('Repeat');
  $property->property = 'background-repeat';
  $property->property_parent = '';
  $property->property_type = 'radio';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    'no-repeat' => 'None',
    'repeat-x' => 'Horizontally',
    'repeat-y' => 'Vertically',
    'repeat' => 'Both',
  );
  $propertys['background-repeat'] = $property;

  // Background position.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'background-position';
  $property->description = t('Position');
  $property->property = 'background-position';
  $property->property_parent = '';
  $property->property_type = 'select';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    '0% 0%' => 'left top',
    '100% 0%' => 'right top',
    '0% 100%' => 'left bottom',
    '100% 100%' => 'right bottom',
    '50% 50%' => 'center center',
    '50% 100%' => 'center bottom',
    '50% 0%' => 'center top',
  );
  $propertys['background-position'] = $property;

  // Background-attachment
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'background-attachment';
  $property->description = t('Attachment', array(), array('context' => 'sweaver'));
  $property->property = 'background-attachment';
  $property->property_parent = '';
  $property->property_type = 'radio';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    'scroll' => 'Scroll',
    'fixed' => 'Fixed',
  );
  $propertys['background-attachment'] = $property;  

  // Padding.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'padding-top';
  $property->description = t('Top');
  $property->property = 'padding-top';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 150;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['padding-top'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'padding-right';
  $property->description = t('Right');
  $property->property = 'padding-right';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 150;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['padding-right'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'padding-bottom';
  $property->description = t('Bottom');
  $property->property = 'padding-bottom';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 150;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['padding-bottom'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'padding-left';
  $property->description = t('Left');
  $property->property = 'padding-left';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 150;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['padding-left'] = $property;

  // Position Settings.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'position-settings';
  $property->description = t('Position settings');
  $property->property = '';
  $property->property_parent = '';
  $property->property_type = 'parent';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
    '#attributes' => array('id' => 'sweaver-style-margin'),
    '#rows' => array( // Margin & Border & Padding
        array(
            array(
                'data' => '<span>'.t('Margin').'</span>',
                'class' => array('corner', 'label'),
            ), 
            array(
                'data' => '{margin-top}',
                'class' => 'side',
            ),
            array(
                'class' => 'corner',
            ),
        ),
        array(
            array(
                'data' => '{margin-left}',
                'class' => 'side',
            ),
            array( // Border & Padding
                'data' => array(
                    '#theme' => 'table',
                    '#rows' => array(
                        array(
                            array(
                                'data' => '<span>'.t('Border').'</span>',
                                'class' => array('corner', 'label'),
                            ),
                            array(
                                'data' => '{border-top-width}',
                                'class' => 'side',
                            ),
                            array(
                                'class' => 'corner',
                            ),
                        ),
                        array(
                            array(
                                'data' => '{border-left-width}',
                                'class' => 'side',
                            ),
                            array( // Padding
                                'data' => array(
                                    '#theme' => 'table',
                                    '#rows' => array(
                                        array(
                                            array(
                                                'data' => '<span>'.t('Padding').'</span>',
                                                'class' => array('corner', 'label'),
                                            ),
                                            array(
                                                'data' => '{padding-top}',
                                                'class' => 'side',
                                            ),
                                            array(
                                                'class' => 'corner',
                                            ),
                                        ),
                                        array(
                                            array(
                                                'data' => '{padding-left}',
                                                'class' => 'side',
                                            ),
                                            array(
                                                'data' => t('Content'),
                                                'class' => 'table-center',    
                                            ),
                                            array(
                                                'data' => '{padding-right}',
                                                'class' => 'side',
                                            ),
                                        ),
                                        array(
                                            array(
                                                'class' => 'corner',
                                            ),
                                            array(
                                                'data' => '{padding-bottom}',
                                                'class' => 'side',
                                            ),
                                            array(
                                                'class' => 'corner',
                                            ),
                                        ),    
                                    ),
                                    '#attributes' => array('id' => 'sweaver-style-padding'),
                                )
                            ), 
                            array(
                                'data' => '{border-right-width}',
                                'class' => 'side',
                            ),
                        ),
                        array(
                            array(
                                'class' => 'corner',
                            ), 
                            array(
                                'data' => '{border-bottom-width}',
                                'class' => 'side',
                            ),
                            array(
                                'class' => 'corner',
                            ),
                        ),
                    ),
                    '#attributes' => array('id' => 'sweaver-style-border'),
                ), 
            ),
            array(
                'data' => '{margin-right}',
                'class' => 'side',
            ),
        ),
        array(
            array(
                'class' => 'corner',
            ), 
            array(
                'data' => '{margin-bottom}',
                'class' => 'side',
            ),
            array(
                'class' => 'corner',
            ),
        ),
    ),
  );
  $propertys['position-settings'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'margin-top';
  $property->description = t('Top');
  $property->property = 'margin-top';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 250;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['margin-top'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'margin-right';
  $property->description = t('Right');
  $property->property = 'margin-right';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 250;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['margin-right'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'margin-bottom';
  $property->description = t('Bottom');
  $property->property = 'margin-bottom';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 250;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['margin-bottom'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'margin-left';
  $property->description = t('Left');
  $property->property = 'margin-left';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 250;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['margin-left'] = $property;

  // Border.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'border-top-width';
  $property->description = t('Top');
  $property->property = 'border-top-width';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 20;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['border-top-width'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'border-right-width';
  $property->description = t('Right');
  $property->property = 'border-right-width';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 20;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['border-right-width'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'border-bottom-width';
  $property->description = t('Bottom');
  $property->property = 'border-bottom-width';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 20;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['border-bottom-width'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'border-left-width';
  $property->description = t('Left');
  $property->property = 'border-left-width';
  $property->property_parent = 'position-settings';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 20;
  $property->property_options = array(
    'title_display' => 'invisible',
  );
  $propertys['border-left-width'] = $property;

  // Border color
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'border-color';
  $property->description = t('Border color');
  $property->property = 'border-top-color border-right-color border-bottom-color border-left-color';
  $property->property_parent = '';
  $property->property_type = 'color';
  $property->property_prefix = '#';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array();
  $propertys['border-color'] = $property;

  // Border style
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'border-style';
  $property->description = t('Border style');
  $property->property = 'border-top-style border-right-style border-bottom-style border-left-style';
  $property->property_parent = '';
  $property->property_type = 'select';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
        'none' => t('None'),
        'dashed' => t('Dashed'),
        'dotted' => t('Dotted'),
        'solid' => t('Solid'),
        'double' => t('Double'),
        'groove' => t('Groove'),
        'inset' => t('Inset'),
        'outset' => t('Outset'),
        'ridge' => t('Ridge'),
  );
  $propertys['border-style'] = $property;

  // Table extras.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'border-collapse';
  $property->description = t('Border collapse');
  $property->property = 'border-collapse';
  $property->property_parent = '';
  $property->property_type = 'select';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
        'collapse' => 'Collapse',
        'separate' => 'Separate',
  );
  $propertys['border-collapse'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'border-spacing';
  $property->description = t('Border spacing');
  $property->property = 'border-spacing';
  $property->property_parent = '';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 20;
  $property->property_options = array();
  $propertys['border-spacing'] = $property;

  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'vertical-align';
  $property->description = t('Vertical align');
  $property->property = 'vertical-align';
  $property->property_parent = '';
  $property->property_type = 'select';
  $property->property_prefix = '';
  $property->property_suffix = '';
  $property->property_slider_min = '';
  $property->property_slider_max = '';
  $property->property_options = array(
        'top' => 'Top',
        'bottom' => 'Bottom',
        'middle' => 'Middle',
  );
  $propertys['vertical-align'] = $property;


  // Width.
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'width';
  $property->description = t('Width');
  $property->property = 'width';
  $property->property_parent = '';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 2000;
  $property->property_options = array();
  $propertys['width'] = $property;

  // Height
  $property = new stdClass;
  $property->api_version = 1;
  $property->disabled = FALSE;
  $property->name = 'height';
  $property->description = t('Height');
  $property->property = 'height';
  $property->property_parent = '';
  $property->property_type = 'slider';
  $property->property_prefix = '';
  $property->property_suffix = 'px';
  $property->property_slider_min = 0;
  $property->property_slider_max = 2000;
  $property->property_options = array();
  $propertys['height'] = $property;

  return $propertys;
}

/**
 * sweaver types.
 */
function _sweaver_default_sweaver_type() {
  $types = array();

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'block';
  $type->description = 'Block';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'margin-top' => 'margin-top',
    'margin-right' => 'margin-right',
    'margin-bottom' => 'margin-bottom',
    'margin-left' => 'margin-left',
    'border-top-width' => 'border-top-width',
    'border-right-width' => 'border-right-width',
    'border-bottom-width' => 'border-bottom-width',
    'border-left-width' => 'border-left-width',
    'border-style' => 'border-style',
    'border-color' => 'border-color',
    'width' => 'width',
    'height' => 'height',
  );
  $types['block'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'inline';
  $type->description = 'Inline';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'margin-top' => 'margin-top',
    'margin-right' => 'margin-right',
    'margin-bottom' => 'margin-bottom',
    'margin-left' => 'margin-left',
    'border-top-width' => 'border-top-width',
    'border-right-width' => 'border-right-width',
    'border-bottom-width' => 'border-bottom-width',
    'border-left-width' => 'border-left-width',
    'border-style' => 'border-style',
    'border-color' => 'border-color',
  );
  $types['inline'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'inline-block';
  $type->description = 'Inline block';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'margin-top' => 'margin-top',
    'margin-right' => 'margin-right',
    'margin-bottom' => 'margin-bottom',
    'margin-left' => 'margin-left',
    'border-top-width' => 'border-top-width',
    'border-right-width' => 'border-right-width',
    'border-bottom-width' => 'border-bottom-width',
    'border-left-width' => 'border-left-width',
    'border-style' => 'border-style',
    'border-color' => 'border-color',
    'width' => 'width',
    'height' => 'height',
  );
  $types['inline-block'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'inline-table';
  $type->description = 'Inline table';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'margin-top' => 'margin-top',
    'margin-right' => 'margin-right',
    'margin-bottom' => 'margin-bottom',
    'margin-left' => 'margin-left',
    'border-top-width' => 'border-top-width',
    'border-right-width' => 'border-right-width',
    'border-bottom-width' => 'border-bottom-width',
    'border-left-width' => 'border-left-width',
    'border-style' => 'border-style',
    'border-color' => 'border-color',
    'width' => 'width',
    'height' => 'height',
  );
  $types['inline-table'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'list-item';
  $type->description = 'List item';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'margin-top' => 'margin-top',
    'margin-right' => 'margin-right',
    'margin-bottom' => 'margin-bottom',
    'margin-left' => 'margin-left',
    'border-top-width' => 'border-top-width',
    'border-right-width' => 'border-right-width',
    'border-bottom-width' => 'border-bottom-width',
    'border-left-width' => 'border-left-width',
    'border-style' => 'border-style',
    'border-color' => 'border-color',
    'width' => 'width',
    'height' => 'height',
  );
  $types['list-item'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'run-in';
  $type->description = 'Run in';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'margin-top' => 'margin-top',
    'margin-right' => 'margin-right',
    'margin-bottom' => 'margin-bottom',
    'margin-left' => 'margin-left',
    'border-top-width' => 'border-top-width',
    'border-right-width' => 'border-right-width',
    'border-bottom-width' => 'border-bottom-width',
    'border-left-width' => 'border-left-width',
    'border-style' => 'border-style',
    'border-color' => 'border-color',
    'width' => 'width',
    'height' => 'height',
  );
  $types['run-in'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'table';
  $type->description = 'Table';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'margin-top' => 'margin-top',
    'margin-right' => 'margin-right',
    'margin-bottom' => 'margin-bottom',
    'margin-left' => 'margin-left',
    'border-top-width' => 'border-top-width',
    'border-right-width' => 'border-right-width',
    'border-bottom-width' => 'border-bottom-width',
    'border-left-width' => 'border-left-width',
    'border-style' => 'border-style',
    'border-color' => 'border-color',
    'border-collapse' => 'border-collapse',
    'border-spacing' => 'border-spacing',
    'width' => 'width',
    'height' => 'height',
  );
  $types['table'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'table-caption';
  $type->description = 'Table caption';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'margin-top' => 'margin-top',
    'margin-right' => 'margin-right',
    'margin-bottom' => 'margin-bottom',
    'margin-left' => 'margin-left',
    'border-top-width' => 'border-top-width',
    'border-right-width' => 'border-right-width',
    'border-bottom-width' => 'border-bottom-width',
    'border-left-width' => 'border-left-width',
    'border-style' => 'border-style',
    'border-color' => 'border-color',
    'width' => 'width',
    'height' => 'height',
  );
  $types['table-caption'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'table-cell';
  $type->description = 'Table cell';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'vertical-align' => 'vertical-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'height' => 'height',
  );
  $types['table-cell'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'table-header-group';
  $type->description = 'Table header';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'vertical-align' => 'vertical-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'height' => 'height',
  );
  $types['table-header-group'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'table-footer-group';
  $type->description = 'Table footer';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'vertical-align' => 'vertical-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
    'padding-top' => 'padding-top',
    'padding-right' => 'padding-right',
    'padding-bottom' => 'padding-bottom',
    'padding-left' => 'padding-left',
    'height' => 'height',
  );
  $types['table-footer-group'] = $type;

  $type = new stdClass;
  $type->api_version = 1;
  $type->disabled = FALSE;
  $type->name = 'table-row';
  $type->description = 'Table row';
  $type->type_options = array(
    'font-family' => 'font-family',
    'font-style' => 'font-style',
    'font-weight' => 'font-weight',
    'font-size' => 'font-size',
    'line-height' => 'line-height',
    'text-align' => 'text-align',
    'vertical-align' => 'vertical-align',
    'color' => 'color',
    'text-decoration' => 'text-decoration',
    'background-color' => 'background-color',
    'background-image' => 'background-image',
    'background-repeat' => 'background-repeat',
    'background-position' => 'background-position',
    'background-attachment' => 'background-attachment',
  );
  $types['table-row'] = $type;

  return $types;
}
