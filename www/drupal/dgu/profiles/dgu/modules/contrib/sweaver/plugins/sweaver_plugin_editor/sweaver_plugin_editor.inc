<?php

/**
 * @file
 * Properties editor class.
 */
class sweaver_plugin_editor extends sweaver_plugin {

  /**
   * Menu registry.
   */
  public function sweaver_menu(&$weight, $page_arguments, $base) {
    $items = array();

    $base = array(
      'load arguments' => array('%map'),
      'access arguments' => array('configure sweaver'),
      'file' => 'plugins/sweaver_plugin_editor/sweaver_plugin_editor.admin.inc',
      'type' => MENU_CALLBACK,
    );

    $items['admin/config/user-interface/sweaver'] = array(
      'title' => 'Sweaver',
      'description' => 'Visual interface for tweaking or building Drupal themes.',
      'page callback' => 'drupal_get_form',
      'page arguments' => array('sweaver_settings'),
      'access arguments' => array('configure sweaver'),
      'file' => 'plugins/sweaver_plugin_editor/sweaver_plugin_editor.admin.inc',
    );
    $items['admin/config/user-interface/sweaver/settings'] = array(
      'title' => 'General',
      'type' => MENU_DEFAULT_LOCAL_TASK,
      'weight' => $weight++,
    );

    // Enable or disable plugins.
    $items['admin/config/user-interface/sweaver/plugins'] = $base + array(
      'title' => 'Plugins',
      'page callback' => 'drupal_get_form',
      'page arguments' => array('sweaver_plugin_editor_config_plugins'),
      'weight' => $weight++,
    );
    $items['admin/config/user-interface/sweaver/plugins']['type'] = MENU_LOCAL_TASK;


    // Editor form configuration.
    $items['admin/config/user-interface/sweaver/editor'] = $base + array(
      'title' => 'Editor',
      'page callback' => 'drupal_get_form',
      'page arguments' => array('sweaver_plugin_editor_config_editor'),
      'weight' => $weight++,
    );
    $items['admin/config/user-interface/sweaver/editor']['type'] = MENU_LOCAL_TASK;
    $items['admin/config/user-interface/sweaver/editor/form'] = $base + array(
      'title' => 'Form',
      'page callback' => 'drupal_get_form',
      'page arguments' => array('sweaver_plugin_editor_config_editor'),
      'weight' => $weight++,
    );
    $items['admin/config/user-interface/sweaver/editor/form']['type'] = MENU_DEFAULT_LOCAL_TASK;

    $menu_items = array(
      'selectors' => array(
        'title' => 'Selectors',
        'ctools_collection' => 'selectors',
        'ctools_object' => 'selector',
        'ctools_table' => 'sweaver_selector',
      ),
      'properties' => array(
        'title' => 'Properties',
        'ctools_collection' => 'properties',
        'ctools_object' => 'property',
        'ctools_table' => 'sweaver_property',
      ),
      'types' => array(
        'title' => 'Types',
        'ctools_collection' => 'types',
        'ctools_object' => 'type',
        'ctools_table' => 'sweaver_type',
      ),
    );

    foreach ($menu_items as $key => $item) {

      $items['admin/config/user-interface/sweaver/editor/'. $item['ctools_collection']] = array(
        'title' => $item['title'],
        'page callback' => 'drupal_get_form',
        'page arguments' => array('sweaver_plugin_editor_objects_list', $item['ctools_object']),
        'access arguments' => array('configure sweaver'),
        'file' => 'plugins/sweaver_plugin_editor/sweaver_plugin_editor.admin.inc',
        'type' => MENU_LOCAL_TASK,
        'weight' => $weight++,
      );
      $items['admin/config/user-interface/sweaver/editor/add/'. $item['ctools_object']] = $base + array(
        'title' => 'Add new ' . $item['ctools_object'],
        'page callback' => 'drupal_get_form',
        'page arguments' => array('sweaver_object_form', $item['ctools_object']),
      );
      $items['admin/config/user-interface/sweaver/editor/edit/'. $item['ctools_object'] .'/%sweaver_object'] = $base + array(
        'title' => 'Edit ' . $item['ctools_object'],
        'page callback' => 'drupal_get_form',
        'page arguments' => array('sweaver_object_form', $item['ctools_object'], 7),
      );
      $items['admin/config/user-interface/sweaver/editor/delete/'. $item['ctools_object'] .'/%sweaver_object'] = $base + array(
        'title' => 'Delete ' . $item['ctools_object'],
        'page callback' => 'drupal_get_form',
        'page arguments' => array('sweaver_object_delete', $item['ctools_collection'], $item['ctools_object'], 7, 'delete', 'deleted'),
      );
      $items['admin/config/user-interface/sweaver/editor/revert/'. $item['ctools_object'] .'/%sweaver_object'] = $base + array(
        'title' => 'Revert ' . $item['ctools_object'],
        'page callback' => 'drupal_get_form',
        'page arguments' => array('sweaver_object_delete', $item['ctools_collection'], $item['ctools_object'], 7, 'revert', 'reverted'),
      );
      $items['admin/config/user-interface/sweaver/editor/enable/'. $item['ctools_object'] .'/%sweaver_object'] = $base + array(
        'title' => 'Enable ' . $item['ctools_object'],
        'page callback' => 'sweaver_object_status',
        'page arguments' => array($item['ctools_collection'], 7, FALSE),
      );
      $items['admin/config/user-interface/sweaver/editor/disable/'. $item['ctools_object'] .'/%sweaver_object'] = $base + array(
        'title' => 'Disable ' . $item['ctools_object'],
        'page callback' => 'sweaver_object_status',
        'page arguments' => array($item['ctools_collection'], 7, TRUE),
      );
      $items['admin/config/user-interface/sweaver/editor/export/'. $item['ctools_object'] .'/%sweaver_object'] = $base + array(
        'title' => 'Export ' . $item['ctools_object'],
        'page callback' => 'sweaver_object_export',
        'page arguments' => array($item['ctools_object'], 7),
      );
    }

    return $items;
  }

  /**
   * Theme registry.
   */
  public function sweaver_theme() {
    $theme_functions = array();

    $editor_plugin_path = drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_editor';
    $theme_functions = array(
      'sweaver_plugin_editor_config_editor' => array(
        'template' => 'sweaver-plugin-editor-config-editor',
        'file' => 'sweaver_plugin_editor.theme.inc',
        'path' => $editor_plugin_path,
        'render element' => 'form',
      ),
      'sweaver_plugin_editor_config_plugins' => array(
        'template' => 'sweaver-plugin-editor-config-plugins',
        'file' => 'sweaver_plugin_editor.theme.inc',
        'path' => $editor_plugin_path,
        'render element' => 'form',
      ),
      'sweaver_plugin_editor_objects_list' => array(
        'render element' => 'form',
      ),
    );

    return $theme_functions;
  }

  /**
   * Frontend form.
   */
  public function sweaver_form() {
    $form = array();
    $form['#editor_containers'] = array();

    $current_style = Sweaver::get_instance()->get_current_style();
    $form['sweaver-css'] = array(
      '#type' => 'hidden',
      '#default_value' => isset($current_style->css) ? $current_style->css : '',
    );
    $form['css-rendered'] = array(
      '#type' => 'hidden',
      '#default_value' => '',
    );

    $properties = sweaver_object_load(NULL, 'property');
    $sweaver_editor_form_configuration = variable_get('sweaver_editor_form_configuration', array());
    

    // Images.
    $images = array('' => t('Theme default'), 'none' => t('No image'));
    $image_handler_plugin = variable_get('sweaver_plugin_handle_images', '');
    if (!empty($image_handler_plugin)) {
      $image_handler = Sweaver::get_instance()->get_plugin($image_handler_plugin);
      if (is_object($image_handler) && method_exists($image_handler, 'sweaver_images_handler')) {
        $image_handler->sweaver_images_handler($images);
      }
    }

    // Container and properties.
    foreach ($sweaver_editor_form_configuration as $container => $settings) {
      if (!empty($settings['properties'])) {
        // Container title.
        $form['#editor_containers'][$container]['title'] = check_plain($settings['title']);
        foreach ($settings['properties'] as $weight => $property_key) {
          $form['#editor_containers'][$container]['properties'][$property_key] = $property_key;

          // Create property element, continue if it doesn't exist.
          if (!isset($properties[$property_key])) {
            continue;
          }
          $property = $properties[$property_key];
          sweaver_export_check_serialized_keys($property);
          $form[$property->name] = $this->sweaver_property_element($property, $images);
          // Any children?
          if ($property->property_type == 'parent') {
            foreach ($properties as $key => $prop) {
              if ($prop->property_parent == $property->name && !$prop->disabled)
              $form[$property->name][$prop->name] = $this->sweaver_property_element($prop, $images);
            }
          }
        }
      }
    }

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

    $output .= '<div id="sweaver-editor" class="clearfix">';

    // Tab switcher.
    $output .= drupal_render($form[$name]['form']['editor_switcher']);

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

      //TODO: All of the container count method has to be rethought
      // Combine all properties in containers.
      $i = 0;
      $container_count = 1;
      $container_total = 1;
      foreach ($container_value['properties'] as $property) {
        //var_dump($form[$name]['form'][$property]);
        if (isset($form[$name]['form'][$property]['#theme'])){
            if ($form[$name]['form'][$property]['#theme'] == 'table') {
                $form[$name]['form'][$property]['#rows'] = $this->sweaver_recursive_table_element($form[$name]['form'][$property]['#rows'], $form[$name]['form'][$property]);
                $i = 4; // The container is closed after the table
            }
            elseif($form[$name]['form'][$property]['#name'] == 'background-image'){
                $i = 4; // The container is closed after the table
            }
        }
        $i++;
        if ($i == 5){
          $container_total++;
          $i = 0;
        }
      }
      $i = 0;
      
      $containers .= '<div id="container-'. $key .'" class="container-wrapper">';
      
      foreach ($container_value['properties'] as $property) {
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
        
        if (isset($form[$name]['form'][$property]['#theme'])){
            if ($form[$name]['form'][$property]['#theme'] == 'table') {
                $form[$name]['form'][$property]['#rows'] = $this->sweaver_recursive_table_element($form[$name]['form'][$property]['#rows'], $form[$name]['form'][$property]);
                $i = 4; // The container is closed after the table
            }
            elseif($form[$name]['form'][$property]['#name'] == 'background-image'){
                $i = 4; // The container is closed after the table
            }
        }
        
        $containers .= drupal_render($form[$name]['form'][$property]);
        $i++;
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
    }

    $output .= '<div class="vertical-tabs">' . $vertical_tabs . '</div>';
    $output .= '<div class="vertical-content">' . $containers . '</div>';

    $output .= '</div>';

    $vars['tabs_data'][$name]['content'] = $output;
  }
  
  /**
   * Frontend css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {

    drupal_add_js(drupal_get_path('module', 'sweaver') . '/plugins/sweaver_plugin_editor/sweaver_plugin_editor.js');

    // Serializer for database storage
    drupal_add_js(drupal_get_path('module', 'sweaver') . '/plugins/sweaver_plugin_editor/jquery.json-2.2.js');

    // Slider
    drupal_add_library('system', 'ui.slider');
    drupal_add_css('misc/ui/jquery.ui.theme.css');

    // colorpicker
    drupal_add_css(drupal_get_path('module', 'sweaver') . '/plugins/sweaver_plugin_editor/colorpicker/css/colorpicker.css');
    drupal_add_js(drupal_get_path('module', 'sweaver') . '/plugins/sweaver_plugin_editor/colorpicker/js/colorpicker.js');

    // Selectors can either come from the database or from the theme info file.
    // Depending on the setting we'll decide from which source/ we'll be adding
    // the selectors into the inline javascript.
    $selectors = array();
    $default_source = TRUE;
    $theme_key = Sweaver::get_instance()->get_theme_key();

    if (variable_get('sweaver_selectors_source', FALSE)) {
      $theme_info = sweaver_get_theme_info($theme_key);
      if (isset($theme_info['sweaver']['selectors'])) {
        foreach ($theme_info['sweaver']['selectors'] as $selector_selector => $selector_description) {
          $selector = new stdClass;
          if (!is_array($selector_description)) {
            $name = str_replace(array('', '.', '-'), array(''), $selector_selector);
            $selector->name = $name;
            $selector->description = $selector_description;
            $selector->selector_selector = $selector_selector;
            $selector->selector_highlight = FALSE;
            $selectors[$name] = $selector;
          }
          else {
            if (isset($selector_description['type'])) {
              if ($selector_description['type'] == 'replace') {
                if (isset($selector_description['name'])) {
                  $name = $selector_description['name'];
                }
                else {
                  $name = str_replace(array(
                    '',
                    '.',
                    '-'), array(''), $selector_selector);
                }
                $selector->name = $name;
                $selector->description = isset($selector_description['description']) ? $selector_description['description'] :
                  $selector->name;
                $selector->selector_selector = $selector_selector;

                if (isset($selector_description['selector_highlight'])) {
                  if ($selector_description['selector_highlight']) {
                    $selector->selector_highlight = true;
                  }
                  else {
                    $selector->selector_highlight = false;
                  }
                }
                else {
                  $selector->selector_highlight = false;
                }

                if (isset($selector_description['weight'])) {
                  $selector->weight = $selector_description['weight'];
                }

                $selectors[$selector->name] = $selector;
              }
            }
          }
        }

        if (!empty($selectors)) {
          $default_source = FALSE;
        }
      }
    }
    
    if ($default_source) {
      $selectors = sweaver_object_load(NULL, 'selector');
      $order = variable_get('sweaver_selector_order', array());
    }
    
    $new_weight = 20;
    $js_selectors = array();
    foreach ($selectors as $key => $selector) {
      if (isset($order[$key])) {
        $weight = $order[$key];
      }
      else {
        if (isset($selector->weight)) {
          $weight = $selector->weight;
        }
        else {
          $weight = $new_weight++;
        }
      }
      $options = array(
        'weight' => $weight,
        'name' => $selector->name,
        'description' => check_plain($selector->description),
        'selector' => check_plain($selector->selector_selector),
        'highlight' => $selector->selector_highlight,
      );
      $js_selectors[$key] = $options;
    }
    asort($js_selectors);

    // Types.
    $js_types = array();
    $types = sweaver_object_load(NULL, 'type');
    foreach ($types as $key => $type) {
      sweaver_export_check_serialized_keys($type);
      $js_types[$key] = $type->type_options;
    }

    // Properties.
    $js_properties = array();
    $properties = sweaver_object_load(NULL, 'property');
    foreach ($properties as $key => $property) {
      sweaver_export_check_serialized_keys($property);
      if ($property->property_type != 'parent') {
        $options = array(
          'name' => $property->name,
          'property' => $property->property,
          'parent' => $property->property_parent,
          'type' => $property->property_type,
          'options' => $property->property_options,
          'prefix' => $property->property_prefix,
          'suffix' => $property->property_suffix,
          'slider_min' => $property->property_slider_min,
          'slider_max' => $property->property_slider_max,
        );
      $js_properties[$key] = $options;
      }
    }
    
    // Excluded selectors.
    $js_excluded_selectors = array();
    $exclude_selectors = variable_get('sweaver_selectors_exclude', SWEAVER_SELECTORS_EXCLUDE);
    $exploded = explode("\n", $exclude_selectors);
    foreach ($exploded as $key => $selector) {
      $trimmed = trim($selector);
      if (!empty($trimmed)) {
        $js_excluded_selectors[] = $trimmed;
      }
    }
    $js_excluded_selectors = implode(',', $js_excluded_selectors);

    // Excluded classes.
    $js_excluded_classes = array();
    $exclude_classes = variable_get('sweaver_classes_exclude', SWEAVER_CLASSES_EXCLUDE);
    $exploded = explode("\n", $exclude_classes);
    foreach ($exploded as $key => $class) {
      $trimmed = trim($class);
      if (!empty($trimmed)) {
        $js_excluded_classes[] = $trimmed;
      }
    }

    $inline_settings['sweaver']['selectors'] = $js_selectors;
    $inline_settings['sweaver']['types'] = $js_types;
    $inline_settings['sweaver']['properties'] = $js_properties;
    $inline_settings['sweaver']['exclude_selectors'] = $js_excluded_selectors;
    $inline_settings['sweaver']['exclude_classes'] = $js_excluded_classes;
    $inline_settings['sweaver']['preview_selector'] = variable_get('sweaver_preview_selection', TRUE);
    $inline_settings['sweaver']['combined_selectors'] = variable_get('sweaver_combined_selectors', FALSE);
    $inline_settings['sweaver']['translate_path'] = variable_get('sweaver_translate_path', TRUE);
    global $base_root;
    $inline_settings['sweaver']['base_root'] = $base_root;
  }

  /**
   * Create a form element for a property.
   *
   * @param $property
   *   The property.
   * @param $images
   *   A collection of images to use for the image type.
   */
  private function sweaver_property_element($property, $images) {
    switch ($property->property_type) {

      case 'slider':
        return array(
          '#type' => 'textfield',
          '#title' => $property->description,
          '#attributes' => array(
            'class' => array('slider-value'),
            'title' => $property->description,
            'autocomplete' => 'off',
          ),
          '#prefix' => isset($property->css_prefix) ? $property->css_prefix : '',
          '#suffix' => isset($property->css_suffix) ? $property->css_suffix : '',          
        );
        break;
      
      // New Type of Field implemented to improve the interface
      case 'checkbox':
        return array(
          '#markup' => '<div id="button-checkbox-'.$property->name.'" class="editor_icons form-item-'.$property->name.'" title="'.$property->description.'"></div>',
          );
        break;
      
      case 'color':
        return array(
          '#markup' =>  '<div id="edit-'. $property->name .'-wrapper" class="form-item clearfix">
            <label class="color">' . $property->description .':</label>
            <div id="'. $property->name .'" class="colorSelector-wrapper">
            <div class="colorSelector"><div style="background-color: #ffffff"></div>
            </div></div></div>'
        );
        break;                   

      case 'image':
        $sweaver = Sweaver::get_instance();
        if ($sweaver->is_plugin_activated('sweaver_plugin_images')){
          return array(
            '#type' => 'select',
            '#title' => $property->description,
            '#options' => $images,
            '#attributes' => array(
              'class' => array('background-image'),
            ),
          );
        }
        else {
          return array(
            '#type' => 'managed_file',
            '#title' => $property->description,
            '#size' => '40',
            '#upload_location' => 'public://sweaver/',
            '#upload_validators' => array(
              'file_validate_is_image' => array(),
              'file_validate_extensions' => array('png gif jpg jpeg'),
            ),
          ); 
        }
        break;

      case 'select':
        return array(
          '#type' => 'select',
          '#title' => $property->description,
          '#options' => $property->property_options,
          '#prefix' => isset($property->css_prefix) ? $property->css_prefix : '',
          '#suffix' => isset($property->css_suffix) ? $property->css_suffix : '',
        );
        break;

      case 'parent':
        if (empty($property->property_options)) {
            return array(
              '#type' => 'markup',
              '#prefix' => '<div class="sweaver-group clearfix"><label>'. $property->description .':</label><div class="sweaver-group-content">',
              '#suffix' => '</div></div>',
            );
        }
        else {
          return array(
            '#theme' => 'table')
            + $property->property_options;
        }
        break;
        
      // New Type of Field implemented to improve the interface
      case 'radio':
        $return_markup = '';
        foreach ($property->property_options as $key => $value)
            $return_markup .= '<div id="button-radio-'.$property->name.'-'.$key.'" name="'. $property->name.'" class="editor_icons form-item-'.$property->name.'" title="'.$property->description . ' : ' . $value.'"></div>';
        return array(
          '#markup' => $return_markup,
          '#prefix' => '<div class="sweaver-group clearfix"><label>'. $property->description .':</label><div class="sweaver-group-content">',
          '#suffix' => '</div></div>',
        );
        break;
        
    }
  }
  
  private function sweaver_recursive_table_element ($property, $properties)
  {
    if (is_array($property))
    {
      foreach($property as $kee => $value)
      {
        if (is_array($value))
          $property[$kee] = $this->sweaver_recursive_table_element($value, $properties);
          
        elseif (preg_match('/^{([a-zA-Z_-]+)}$/', $value, $property_name)) {
          // $property_name[0] contains the entire string and $property_name[1] the first variable
          $property_name = $property_name[1];
          if (isset($properties[$property_name]))
            $property[$kee] = $properties[$property_name]; 
        }
      }
      return $property;
    }
  }
}
