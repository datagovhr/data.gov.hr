<?php

/**
 * @file
 * Administrative functions for Sweaver.
 */

/**
 * Settings form.
 */
function sweaver_settings($form, $form_state) {
  $form = array();

  $form['sweaver_enabled'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable sweaver editor'),
    '#default_value' => variable_get('sweaver_enabled', TRUE),
    '#description' => t('Enable the editor at the bottom.'),
  );

  $form['sweaver_preview_selection'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable selection preview'),
    '#default_value' => variable_get('sweaver_preview_selection', TRUE),
    '#description' => t('Enable the preview selector so you see what you are going to change.'),
  );

  $form['sweaver_combined_selectors'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable combined selectors'),
    '#default_value' => variable_get('sweaver_combined_selectors', FALSE),
    '#description' => t('Show combined tag and id or class selectors in the selectors dropdown.'),
  );
  
  $form['sweaver_translate_path'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable translate oject\'s path translation'),
    '#default_value' => variable_get('sweaver_translate_path', TRUE),
    '#description' => t('Translate object path in a human-readable name'),
  );

  $skins = array();
  $ignore = array('.', '..', '.svn', 'CVS', '.git');
  $directories = scandir(drupal_get_path('module', 'sweaver') .'/skins');
  foreach ($directories as $directory) {
    if (!in_array($directory, $ignore)) {
      $skins[$directory] = $directory;
    }
  }
  $form['sweaver_skin'] = array(
    '#type' => 'select',
    '#title' => t('Sweaver skin'),
    '#options' => $skins,
    '#default_value' => variable_get('sweaver_skin', SWEAVER_SKIN),
  );

  $form['sweaver_paths'] = array(
    '#type' => 'textarea',
    '#title' => t('Exclude paths'),
    '#default_value' => variable_get('sweaver_paths', SWEAVER_PATHS_EXCLUDE),
    '#description' => t('Exclude the editor on some pages, usually administration pages. Enter one page per line as Drupal paths. The \'*\' character is a wildcard. &lt;front&gt; is the front page.'),
    '#wysiwyg' => FALSE,
  );

  $form['sweaver_selectors_exclude'] = array(
    '#type' => 'textarea',
    '#title' => t('Exclude selectors'),
    '#default_value' => variable_get('sweaver_selectors_exclude', SWEAVER_SELECTORS_EXCLUDE),
    '#description' => t('Define on which items the style editor should not be applicable. Enter one selector per line.'),
    '#wysiwyg' => FALSE,
  );

  $form['sweaver_classes_exclude'] = array(
    '#type' => 'textarea',
    '#title' => t('Exclude classes'),
    '#default_value' => variable_get('sweaver_classes_exclude', SWEAVER_CLASSES_EXCLUDE),
    '#description' => t('Define which classes should never be displayed in the css path. Enter one selector per line.'),
    '#wysiwyg' => FALSE,
  );

  $form['sweaver_ctools_allowed_properties'] = array(
    '#type' => 'textarea',
    '#title' => t('Allowed Properties'),
    '#default_value' => variable_get('sweaver_ctools_allowed_properties', SWEAVER_CTOOLS_ALLOWED_PROPERTIES),
    '#description' => t('Define which properties can be used in css besides the default ones defined by CTools. That list is found in ctools_css_filter_default_allowed_properties() in ctools/includes/css.inc. Enter one selector per line.'),
    '#wysiwyg' => FALSE,
  );

  $form = system_settings_form($form);
  $form['#submit'][] = 'sweaver_settings_submit';
  return $form;
}

/**
 * Settings screen submit.
 */
function sweaver_settings_submit($form, &$form_state) {
  drupal_theme_rebuild();
}

/**
 * Sweaver objects list.
 *
 * Selectors also have weights.
 */
function sweaver_plugin_editor_objects_list($form, $form_state, $object_type) {

  $form['#tree'] = TRUE;
  $form['#objects'] = array();
  $form['#objects_enabled'] = array();
  $form['#objects_disabled'] = array();
  $form['#object_type'] = $object_type;
  $form['#theme'] = 'sweaver_plugin_editor_objects_list';

  if ($object_type == 'selector') {
    $form['info'] = array(
      '#markup' => t('<p>Only the selectors enabled in the list below will be available when using Sweaver. The higher a selector is placed, the more important it is.</p><p>Example: if you have a \'div\' with the class \'block\', then the path in the Sweaver frontend can either show \'a region\' or \'a block\', depending or the weight of these selectors.</p>'),
    );
    $form['checkbox'] = array(
      '#type' => 'fieldset',
      '#description' => 'Themes can define selectors in the info file. If none are found, the selectors underneath will be used. Toggle the checkbox underneath so Sweaver will look into the theme info file.',
    );
    $form['checkbox']['sweaver_selectors_source'] = array(
      '#type' => 'checkbox',
      '#title' => t('Look for selectors in theme info file'),
      '#default_value' => variable_get('sweaver_selectors_source', FALSE),
    );
    $form['checkbox']['submit'] = array(
      '#type' => 'submit',
      '#value' => t('Save setting'),
      '#suffix' => '<div class="clearfix"></div><br />'
    );
  }

  $form['add_link'] = array(
    '#markup' => l(t('Add new @sweaver_object', array('@sweaver_object' => $object_type)), 'admin/config/user-interface/sweaver/editor/add/'. $object_type),
  );

  $new_weight = 20;
  $objects = sweaver_object_load(NULL, $object_type, 'all');
    
  if (!empty($objects)) {
    if ($object_type == 'selector') {
      $order = variable_get('sweaver_selector_order', array());
    }
    foreach ($objects as $key => $object) {
      $object_name = check_plain($object->name);
      $object_export_type = $object->export_type;
      if (isset($order[$object_name])) {
        $weight = $order[$object_name];
      }
      else {
        if (isset($object->weight)) {
          $weight = $object->weight;
        }
        else {
          $weight = $new_weight++;
        }
      }

      $form[$object_name]['name'] = array(
        '#markup' => $object_name,
      );
      $form[$object_name]['description'] = array(
        '#markup' => check_plain($object->description),
      );
      $form[$object_name]['type'] = array(
        '#markup' => $object->type,
      );

      // Operations.
      $operations = array();
      if ($object_export_type != 4) {
        $operations['edit'] = l(t('Edit'), 'admin/config/user-interface/sweaver/editor/edit/'. $object_type .'/'. $object_name);
      }

      if ($object_export_type != 2 && $object_export_type != 4) {
        $operations['export'] = l(t('Export'), 'admin/config/user-interface/sweaver/editor/export/'. $object_type .'/'. $object_name);
      }

      // Delete - revert.
      if ($object_export_type == 1) {
        $operations['delete'] = l(t('Delete'), 'admin/config/user-interface/sweaver/editor/delete/'. $object_type .'/'. $object_name);
      }
      elseif ($object_export_type == 3) {
        $operations['delete'] = l(t('Revert'), 'admin/config/user-interface/sweaver/editor/revert/'. $object_type .'/'. $object_name);
      }

      // Disable - enable.
      $row_enabled = TRUE;
      if ($object_export_type == 2) {
        if ($object->disabled) {
          $row_enabled = FALSE;
          unset($operations['edit']);
          unset($operations['export']);
          unset($operations['delete']);
          $operations['status'] = l(t('Enable'), 'admin/config/user-interface/sweaver/editor/enable/'. $object_type .'/'. $object_name);
        }
        else {
          $operations['status'] = l(t('Disable'), 'admin/config/user-interface/sweaver/editor/disable/'. $object_type .'/'. $object_name);
        }
      }
      // Exception for allids.
      if ($object_type == 'selector' && in_array($object_name, array('allids', 'alltags', 'allclasses'))) {
        unset($operations['edit']);
      }
      $form[$object_name]['operations'] = array(
        '#markup' => implode(' - ', $operations),
      );

      // Weight for selectors.
      if ($object_type == 'selector') {
        $form[$object_name]['weight'] = array(
          '#type' => 'weight',
          '#delta' => 100,
          '#attributes' => array(
            'class' => array('selector-weight'),
          ),
          '#default_value' => $weight
        );
      }

      if ($row_enabled) {
        $form['#objects_enabled'][] = array('weight' => $weight, 'name' => $object_name, 'status' => TRUE);
      }
      else {
        $form['#objects_disabled'][] = array('weight' => $weight, 'name' => $object_name, 'status' => FALSE);
      }
    }

    // Merge enabled with disabled.
    $form['#objects'] = array_merge($form['#objects_enabled'], $form['#objects_disabled']);
  }
  else {
    $form['info']['#value'] .= t('<p>No @object_type available.</p>', array('@object_type' => $object_type));
  }

  // Add submit button.
  if ($object_type == 'selector') {
    $form['save_selector_order'] = array(
      '#type' => 'submit',
      '#value' => t('Save order'),
    );
  }

  return $form;
}

/**
 * Submit callback. Save objects lists, only used for selectors.
 */
function sweaver_plugin_editor_objects_list_submit($form, &$form_state) {
  // Save selectors source.
  variable_set('sweaver_selectors_source', $form_state['values']['checkbox']['sweaver_selectors_source']);

  $selectors_order = variable_get('sweaver_selector_order', array());

  foreach ($form['#objects_enabled'] as $key => $object) {
    $name = $object['name'];
    $selectors_order[$name] = $form_state['values'][$name]['weight'];
  }

  // Save order.
  variable_set('sweaver_selector_order', $selectors_order);
  drupal_set_message(t('The settings have been saved.'));
}


/**
 * Theme objects list form.
 */
function theme_sweaver_plugin_editor_objects_list(&$vars) {

  $form = &$vars['form'];

  $output = drupal_render($form['checkbox']);
  $output .= drupal_render($form['info']);
  $output .= drupal_render($form['add_link']);
  drupal_add_css(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_editor/sweaver_plugin_editor.admin.css');

  if (!empty($form['#objects'])) {

    $header = array(
      t('Name'),
      t('Description'),
      t('Status'),
      t('Operations'),
    );

    // Add tabledrag for selector type and order the $form['#objects'].
    if ($form['#object_type'] == 'selector') {
      drupal_add_js('misc/tableheader.js');
      drupal_add_tabledrag('object-list-enabled', 'order', 'sibling', 'selector-weight', NULL, NULL, TRUE);
      $header[] = t('Weight');
      asort($form['#objects']);
    }

    $rows_enabled = array();
    $rows_disabled = array();
    foreach ($form['#objects'] as $key => $object) {
      $row = array();
      $object_name = $object['name'];

      $row[] = drupal_render($form[$object_name]['name']);
      $row[] = isset($form[$object_name]['description']) ? drupal_render($form[$object_name]['description']) : '';
      $row[] = isset($form[$object_name]['type']) ? drupal_render($form[$object_name]['type']) : '';
      $row[] = isset($form[$object_name]['operations']) ? drupal_render($form[$object_name]['operations']) : '';

      // Selector has a weight.
      if ($form['#object_type'] == 'selector') {
        if ($object['status']) {
          $row[] = drupal_render($form[$object_name]['weight']);
        }
        else {
          $form[$object_name]['weight']['#type'] = 'value';
          drupal_render($form[$object_name]['weight']);
        }
      }

      // Merge row.
      $row = array_merge(array('data' => $row), array());

      // Only enabled selectors are draggable.
      if ($object['status']) {
        $row['class'] = array('draggable');
        $rows_enabled[] = $row;
      }
      else {
        $row['class'] = array('disabled');
        $rows_disabled[] = $row;
      }
    }

    // Theme output.
    $variables_enabled = array(
      'header' => $header,
      'rows' => $rows_enabled,
      'attributes' => array('id' => 'object-list-enabled'),
    );
    $output .= theme('table', $variables_enabled);
    $output .= drupal_render($form['save_selector_order']);
    if (!empty($rows_disabled)) {
      $variables_disabled = array(
        'header' => array(),
        'rows' => $rows_disabled,
        'attributes' => array('id' => 'object-list-disabled'),
      );
      $output .= theme('table', $variables_disabled);
    }
  }

  $output .= drupal_render_children($form);

  return $output;
}

/**
 * Object form.
 */
function sweaver_object_form($form, $form_state, $object_type, $object = NULL) {
  $form = array();
  $function = 'sweaver_'. $object_type .'_form';
  return $function($form, $object);
}

/**
 * Object new/edit validate callback.
 */
function sweaver_object_form_validate(&$form, &$form_state) {
  $name = $form_state['values']['name'];
  $check_name = $form_state['values']['check_name'];
  $object = sweaver_object_load($name, $form['#object_type']);

  if (isset($object->name) && $check_name) {
    form_set_error('name', t('The machine-readable name already exists'));
  }

  if (!preg_match('!^[a-z0-9_-]+$!', $name)) {
    form_set_error('name', t('The machine-readable name must contain only lowercase letters, underscores or hyphens.'));
  }
}

/**
 * Selector new/edit form.
 */
function sweaver_selector_form(&$form, $selector = NULL) {

  // Deny access to edit form for allids, allclasses and alltags.
  if (isset($selector->name) && in_array($selector->name, array('allids', 'alltags', 'allclasses'))) {
    drupal_set_message(t('This selector cannot be edited.'));
    drupal_goto('admin/config/user-interface/sweaver/editor/selectors');
  }

  if (empty($selector)) {
    $selector = new stdClass;
    $selector->name = '';
    $selector->description = '';
    $selector->selector_selector = '';
    $selector->selector_highlight = FALSE;
    $selector->export_type = 1;
  }

  if (!isset($selector->oid)) {
    $selector->oid = NULL;
  }

  $form['#object_type'] = 'selector';

  $form['check_name'] = array(
    '#type' => 'value',
    '#value' => ($selector->export_type == 1 && !isset($selector->oid)) ? TRUE : FALSE,
  );

  $form['oid'] = array(
    '#type' => 'value',
    '#value' => $selector->oid,
  );

  $form['name'] = array(
    '#title' => t('Machine name'),
    '#type' => 'textfield',
    '#required' => TRUE,
    '#default_value' => $selector->name,
    '#description' => t('The machine-readable name of this selector. This name must contain only lowercase letters, numbers, underscores or hyphens and must be unique.'),
  );
  $form['description'] = array(
    '#title' => t('Description'),
    '#type' => 'textfield',
    '#required' => TRUE,
    '#default_value' => $selector->description,
    '#description' => t('Description of this selector which will be used in the editor.'),
  );
  $form['selector_selector'] = array(
    '#title' => t('Selector'),
    '#type' => 'textfield',
    '#required' => TRUE,
    '#default_value' => $selector->selector_selector,
    '#description' => t('The CSS selector which the editor will act on e.g. a.link'),
  );
  $form['selector_highlight'] = array(
    '#title' => t('Highlight'),
    '#type' => 'checkbox',
    '#default_value' => $selector->selector_highlight,
    '#description' => t('Should this selector be highlighted in the path ?'),
  );

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
    '#submit' => array('sweaver_selector_form_submit'),
  );

  return $form;
}

/**
 * Selector new/edit submit callback.
 */
function sweaver_selector_form_submit(&$form, &$form_state) {
  $values = $form_state['values'];

  // Build selector.
  $selector = new stdClass;
  $selector->oid = $values['oid'];
  $selector->name = $values['name'];
  $selector->description = $values['description'];
  $selector->selector_selector = $values['selector_selector'];
  $selector->selector_highlight = $values['selector_highlight'];

  // Save selector.
  $update = (isset($selector->oid) && is_numeric($selector->oid)) ? array('oid') : array();
  drupal_write_record('sweaver_selector', $selector, $update);
  cache_clear_all('sweaver', 'cache');

  // Message.
  $action = empty($update) ? 'added' : 'updated';
  $message = t('Selector %selector has been @action.', array('%selector' => $selector->name, '@action' => $action));

  // Message and redirect.
  drupal_set_message($message);
  $form_state['redirect'] = 'admin/config/user-interface/sweaver/editor/selectors';
}

/**
 * Property new/edit form.
 */
function sweaver_property_form(&$form, $property = NULL) {

  if (empty($property)) {
    $property = new stdClass;
    $property->name = '';
    $property->property = '';
    $property->property_parent = '';
    $property->description = '';
    $property->property_type = '';
    $property->property_prefix = '';
    $property->property_suffix = '';
    $property->property_slider_min = 1;
    $property->property_slider_max = 72;
    $property->property_options = array();
    $property->export_type = 1;
  }

  if (!isset($property->oid)) {
    $property->oid = NULL;
  }

  // Parents.
  $parents = array('' => '');
  $all_properties = sweaver_object_load(NULL, 'property', 'all');
  foreach ($all_properties as $key => $prop) {
    if ($prop->property_type == 'parent') {
      $parents[$key] = $prop->description;
    }
  }

  $form['#object_type'] = 'property';

  $form['check_name'] = array(
    '#type' => 'value',
    '#value' => ($property->export_type == 1 && !isset($property->oid)) ? TRUE : FALSE,
  );

  $form['oid'] = array(
    '#type' => 'value',
    '#value' => $property->oid,
  );

  $form['name'] = array(
    '#title' => t('Machine name'),
    '#type' => 'textfield',
    '#required' => TRUE,
    '#default_value' => $property->name,
    '#description' => t('The machine-readable name of this property. This name must contain only lowercase letters, numbers, underscores or hyphens and must be unique.'),
  );
  $form['property'] = array(
    '#title' => t('CSS property'),
    '#type' => 'textfield',
    '#required' => FALSE,
    '#default_value' => $property->property,
    '#description' => t('The actual CSS property. Seperate multiple values by spaces. This value can be empty for parent items.'),
  );
  $form['property_parent'] = array(
    '#title' => t('Parent'),
    '#type' => 'select',
    '#options' => $parents,
    '#default_value' => $property->property_parent,
    '#description' => t('The parent of this property. Eg, padding-top should have a parent called padding.'),
  );
  $form['description'] = array(
    '#title' => t('Description'),
    '#type' => 'textfield',
    '#required' => TRUE,
    '#default_value' => $property->description,
    '#description' => t('Description of this property which will be used in the editor.'),
  );
  $form['property_prefix'] = array(
    '#title' => t('Prefix'),
    '#type' => 'textfield',
    '#default_value' => $property->property_prefix,
    '#description' => t('Prefix of this property.'),
  );
  $form['property_suffix'] = array(
    '#title' => t('Suffix'),
    '#type' => 'textfield',
    '#default_value' => $property->property_suffix,
    '#description' => t('Suffix of this property.'),
  );

  $types = array(
    'parent' => t('Parent'),
    'slider' => t('Slider'),
    'select' => t('Select'),
    'color' => t('Color'),
    'image' => t('Image'),
    'radio' => t('Radio'),
    'checkbox' => t('Checkbox'),
  );
  $form['property_type'] = array(
    '#title' => t('Type'),
    '#type' => 'select',
    '#options' => $types,
    '#default_value' => $property->property_type,
    '#description' => t('Selection type of this property. A parent can have children underneath, grouping other stuff together.'),
  );
  $form['property_slider_min'] = array(
    '#title' => t('Slider minimum'),
    '#type' => 'textfield',
    '#default_value' => $property->property_slider_min,
    '#description' => t('Minimum value for the slider, only applicable for the slider.'),
  );
  $form['property_slider_max'] = array(
    '#title' => t('Slider maximum'),
    '#type' => 'textfield',
    '#default_value' => $property->property_slider_max,
    '#description' => t('Maximum value for the slider, only applicable for the slider.'),
  );

  $property_options = '';
  sweaver_export_check_serialized_keys($property);
  if (is_array($property->property_options)) {
    foreach ($property->property_options as $key => $value) {
      $property_options .= $key .'|'. $value ."\n";
    }
  }
  $form['property_options'] = array(
    '#title' => t('Options'),
    '#type' => 'textarea',
    '#default_value' => $property_options,
    '#description' => t('Options for this property. Enter options per line and separate key and value by |.'),
    '#wysiwyg' => FALSE,
  );

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
    '#submit' => array('sweaver_property_form_submit'),
  );

  return $form;
}

/**
 * Property new/edit submit callback.
 */
function sweaver_property_form_submit(&$form, &$form_state) {
  $values = $form_state['values'];

  // Build selector.
  $property = new stdClass;
  $property->oid = $values['oid'];
  $property->name = $values['name'];
  $property->property = $values['property'];
  $property->description = $values['description'];
  $property->property_parent = $values['property_parent'];
  $property->property_type = $values['property_type'];
  $property->property_prefix = $values['property_prefix'];
  $property->property_suffix = $values['property_suffix'];
  $property->property_slider_min = $values['property_slider_min'];
  $property->property_slider_max = $values['property_slider_max'];
  $options = array();
  $property_options = explode("\n", trim($values['property_options']));
  foreach ($property_options as $key => $line) {
    $line_explode = explode("|", $line);
    if (count($line_explode) == 2) {
      $options[$line_explode[0]] = trim($line_explode[1]);
    }
  }
  $property->property_options = serialize($options);

  // Save property.
  $update = (isset($property->oid) && is_numeric($property->oid)) ? array('oid') : array();
  drupal_write_record('sweaver_property', $property, $update);
  cache_clear_all('sweaver', 'cache');

  // Message.
  $action = empty($update) ? 'added' : 'updated';
  $message = t('Property %property has been @action.', array('%property' => $property->name, '@action' => $action));

  // Message and redirect.
  drupal_set_message($message);
  $form_state['redirect'] = 'admin/config/user-interface/sweaver/editor/properties';
}

/**
 * Type new/edit form.
 */
function sweaver_type_form(&$form, $type = NULL) {

  if (empty($type)) {
    $type = new stdClass;
    $type->name = '';
    $type->description = '';
    $type->type_options = array();
    $type->export_type = 1;
  }

  if (!isset($type->oid)) {
    $type->oid = NULL;
  }

  $form['#object_type'] = 'type';

  $form['check_name'] = array(
    '#type' => 'value',
    '#value' => ($type->export_type == 1 && !isset($type->oid)) ? TRUE : FALSE,
  );

  $form['oid'] = array(
    '#type' => 'value',
    '#value' => $type->oid,
  );

  $form['name'] = array(
    '#title' => t('Machine name'),
    '#type' => 'textfield',
    '#required' => TRUE,
    '#default_value' => $type->name,
    '#description' => t('The machine-readable name of this type. This name must contain only lowercase letters, numbers, underscores or hyphens and must be unique.'),
  );
  $form['description'] = array(
    '#title' => t('Description'),
    '#type' => 'textfield',
    '#required' => TRUE,
    '#default_value' => $type->description,
    '#description' => t('Description of this type only to be used for administration forms.'),
  );

  $type_options = sweaver_ctools_object_list('property', -1, TRUE);
  sweaver_export_check_serialized_keys($type);
  $form['type_options'] = array(
    '#title' => t('Options'),
    '#type' => 'checkboxes',
    '#options' => $type_options,
    '#default_value' => $type->type_options,
    '#description' => t('Options for this type.'),
  );

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save'),
    '#submit' => array('sweaver_type_form_submit'),
  );

  return $form;
}

/**
 * Property new/edit submit callback.
 */
function sweaver_type_form_submit(&$form, &$form_state) {
  $values = $form_state['values'];

  // Build selector.
  $type = new stdClass;
  $type->oid = $values['oid'];
  $type->name = $values['name'];
  $type->description = $values['description'];
  $options = $values['type_options'];
  foreach ($options as $key => $value) {
    if ($key !== $value) {
      unset($options[$key]);
    }
  }
  $type->type_options = serialize($options);

  // Save property.
  $update = (isset($type->oid) && is_numeric($type->oid)) ? array('oid') : array();
  drupal_write_record('sweaver_type', $type, $update);
  cache_clear_all('sweaver', 'cache');

  // Message.
  $action = empty($update) ? 'added' : 'updated';
  $message = t('Type %type has been @action.', array('%type' => $type->name, '@action' => $action));

  // Message and redirect.
  drupal_set_message($message);
  $form_state['redirect'] = 'admin/config/user-interface/sweaver/editor/types';
}

/**
 * Export an object.
 */
function sweaver_object_export($object_type, $object) {
  drupal_set_title(check_plain($object->description));
  $code = sweaver_export_sweaver_object($object, $object_type);
  return drupal_get_form('ctools_export_form', $code, check_plain($object->description));
}

/**
 * Delete object form.
 */
function sweaver_object_delete($form, &$form_state, $redirect, $object_type, $object, $action, $action_message) {
  if ($object->export_type != 2) {
    $form['#object'] = $object;
    $form['#object_type'] = $object_type;
    $form['#object_redirect'] = $redirect;
    $form['#action_message'] = $action_message;
    return confirm_form($form, t('Are you sure you want to @action @type %object?', array('@action' => $action, '@type' => $object_type , '%object' => $object->name)), 'admin/config/user-interface/sweaver/editor/'. $redirect);
  }
  else {
    drupal_goto('admin/config/user-interface/sweaver/editor/'. $redirect);
  }
}

/**
 * Delete object submit callback.
 */
function sweaver_object_delete_submit(&$form, &$form_state) {
  cache_clear_all('sweaver', 'cache');
  $object = $form['#object'];
  $redirect = $form['#object_redirect'];
  $object_type = $form['#object_type'];
  $action_message = $form['#action_message'];
  db_query("DELETE FROM {sweaver_" . $object_type . "} WHERE oid = :oid", array(':oid' => $object->oid));
  drupal_set_message(t('Selector %selector has been @action_message.', array('@action_message' => $action_message, '%selector' => $object->name)));
  $form_state['redirect'] = 'admin/config/user-interface/sweaver/editor/'. $redirect;
}

/**
 * Enable or disable an object.
 */
function sweaver_object_status($redirect, $object, $status) {
  ctools_include('export');
  ctools_export_set_object_status($object, $status);
  cache_clear_all('sweaver', 'cache');
  drupal_goto('admin/config/user-interface/sweaver/editor/'. $redirect);
}

/**
 * Editor form.
 */
function sweaver_plugin_editor_config_editor($form, &$form_state) {
  $form = array();
  $form['#tree'] = TRUE;
  $form['#properties_tree'] = array();
  $form['#properties_region'] = array();
  $form['#containers'] = sweaver_containers();
  $sweaver_editor_form_configuration = variable_get('sweaver_editor_form_configuration', array());

  $order = array();
  foreach ($sweaver_editor_form_configuration as $container => $settings) {

    $form['container_form_'. $container] = array(
      '#type' => 'textfield',
      '#default_value' => $settings['title'],
      '#size' => 15,
      '#attributes' => array(
        'class' => array('container-label-edit'),
      ),
    );

    foreach ($settings['properties'] as $weight => $field) {
      $order[$field]['weight'] = $weight;
      $order[$field]['container'] = $container;
    }
  }

  $new_weight = 100;
  $properties = sweaver_object_load(NULL, 'property', 'enabled');
  foreach ($properties as $key => $property) {

    if (!empty($property->property_parent)) {
      continue;
    }

    $container = isset($order[$key]) ? $order[$key]['container'] : 'one';
    $weight = isset($order[$key]) ? $order[$key]['weight'] : $new_weight;

    $form['#properties_tree'][$key] = $key;
    $form['#properties_region'][$container][$weight] = $key;

    $form[$key]['name'] = array(
      '#markup' => $property->description,
    );
    $form[$key]['weight'] = array(
      '#type' => 'weight',
      '#delta' => 50,
      '#attributes' => array(
        'class' => array('property-weight', 'property-weight-'. $container),
      ),
      '#default_value' => $weight,
    );
    $form[$key]['container'] = array(
      '#type' => 'select',
      '#options' => sweaver_containers(),
      '#attributes' => array(
        'class' => array('property-container-select', 'property-container-'. $container),
      ),
      '#default_value' => $container,
    );

    $new_weight++;
  }

  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save configuration'),
  );

  return $form;
}

/**
 * Editor form submit callback.
 */
function sweaver_plugin_editor_config_editor_submit(&$form, &$form_state) {

  $values = $form_state['values'];
  $editor_form_configuration = array();

  // Properties.
  foreach ($form['#properties_tree'] as $property_key) {
    $property = $values[$property_key];
    $editor_form_configuration[$property['container']]['properties'][$property['weight']] = $property_key;
  }

  // Containers title and properties order.
  foreach ($form['#containers'] as $container_key => $container) {
    $editor_form_configuration[$container_key]['title'] = $values['container_form_'. $container_key];
    if (isset($editor_form_configuration[$container_key]['properties'])) {
      ksort($editor_form_configuration[$container_key]['properties']);
    }
    else {
      $editor_form_configuration[$container_key]['properties'] = array();
    }
  }

  drupal_set_message(t('The configuration options have been saved.'));
  variable_set('sweaver_editor_form_configuration', $editor_form_configuration);
}
