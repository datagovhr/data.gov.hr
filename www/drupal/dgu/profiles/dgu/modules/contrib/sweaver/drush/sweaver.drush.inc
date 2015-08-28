<?php

/**
 * @file
 * Sweaver Drush functions.
 *
 * While this is crazy and probably not something that will be
 * used a lot, it's jolly good fun to program this :).
 */

/**
 * Implementation of hook_drush_help().
 */
function sweaver_drush_help($section) {
  switch ($section) {
    case 'drush:sweaver-edit':
      return dt('Edit a style known by Sweaver. With no arguments, the command will list all available styles, after that just add the id as an argument.');
    case 'drush:sweaver-variables':
      return dt('Set some variables for Sweaver. With no arguments, the command will list the default values. Supply "type" and "value" as arguments. You can currently set the editor and the warning message to your likings (defaults to vi and true).');
  }
}


/**
 * Implementation of hook_drush_command().
 */
function sweaver_drush_command() {
  $items = array();

  $items['sweaver-edit'] = array(
    'callback' => 'sweaver_drush_style',
    'description' => dt('Edit the style with your favorite Editor.'),
    'arguments' => array(
      'style_id' => dt('A style ID'),
    ),
    'aliases' => array('swe'),
  );

  $items['sweaver-variables'] = array(
    'callback' => 'sweaver_drush_variables',
    'description' => dt('Set variables for running Sweaver with drush.'),
    'arguments' => array(
      'type' => dt('The type of variable to store. Currenlty only "editor" or "warning".'),
      'value' => dt('The value of the variable. Currently your favorite editor command (+ any arguments if needed) or "true" or "false" for the warning message.'),
    ),
    'aliases' => array('swv'),
  );

  return $items;
}

/**
 * Edit a style via drush.
 *
 * @param $args
 *   Arguments passed by the CLI.
 *
 * @return $mixed
 *   Either a list of styles or start up the editor functionality.
 */
function sweaver_drush_style() {
  $args = func_get_args();
  $styles = sweaver_drush_list_styles();
  $action = sweaver_drush_verify($args);

  switch ($action) {
    case 'list':
      return sweaver_drush_print_styles($styles);
      break;
    case 'edit':
      if (isset($styles[$args[0]])) {
        sweaver_drush_verify_edit($styles[$args[0]]);
        return sweaver_drush_edit_style($styles[$args[0]]);
      }
      drush_print(dt('Style id does not exists.'));
  }
}

/**
 * Edit a style.
 *
 * @param $style
 *   A style object from the Database.
 */
function sweaver_drush_edit_style($style) {

  $warning = variable_get('sweaver_drush_warning_edit', 'true');
  $editor = variable_get('sweaver_drush_editor', 'vi');

  // Display the warning text if needed.
  if ($warning == 'true') {
    $return = drush_confirm(sweaver_drush_warning_text());
    if (!$return) {
      // Bail out.
      drush_set_context("DRUSH_EXECUTION_COMPLETED", TRUE);
      drush_print(dt('Editing of style aborted.'));
      exit();
    }
  }

  // Prepare the css variable from the editor.
  $css = json_decode($style->css);
  $css = (!empty($css)) ? sweaver_drush_json_to_css($css) : '';

  // Create a static $data variable with CTools.
  $data = &drupal_static('sweaver_drush_style_data' , array());
  $data = array(
    'style' => $style,
    'editor' => $editor,
    'ts_enabled' => FALSE,
  );

  // Get some plugins.
  $sweaver = Sweaver::get_instance();
  $sweaver_cs = $sweaver->get_plugin('sweaver_plugin_customcss');
  $sweaver_ts = $sweaver->get_plugin('sweaver_plugin_themesettings');

  // Create steps array.
  $steps = array(
    'css' => $css
  );
  // Add custom css if enabled.
  if ($sweaver_cs) {
    $steps['customcss'] = $style->customcss;
  }
  // Add themesettings if enabled.
  if ($sweaver_ts) {
    $data['ts_enabled'] = TRUE;
    $steps['themesettings'] = sweaver_drush_array_to_string($style->themesettings);
  }
  $data['steps'] = $steps;

  // Step through.
  foreach ($steps as $step => $step_value) {

    // Ask confirmation first.
    $edit = drush_confirm(dt('Do you want to edit the @step ?', array('@step' => $step)));

    if ($edit) {
      $temp_file = drush_save_data_to_temp_file($step_value);
      $data['tempfiles'][$step] = $temp_file;
      $data['current_step'] = $step;
      $edit_command = $editor .' '. $temp_file;
      $pipes = array();

      // Opend the editor.
      proc_close(proc_open($edit_command, array(0 => STDIN, 1 => STDOUT, 2 => STDERR), $pipes));

      // We need to save the new content already here, because we lose the temporary data file.
      $step = $data['current_step'];
      $temp_file = $data['tempfiles'][$step];
      if ($content = file_exists($temp_file)) {
        switch ($step) {
          case 'css':
            $css = file_get_contents($temp_file);
            $style->write_css = $css;
            $style->css = sweaver_drush_css_to_json($css);
            break;
          case 'customcss':
            $data['style']->customcss = file_get_contents($temp_file);
            break;
          case 'themesettings':
            $data['style']->themesettings = serialize(sweaver_drush_array_lines_to_array_key_values(file($temp_file)));
            break;
        }
      }
    }
  }

  // Get the variables again.
  $style = $data['style'];
  $steps = $data['steps'];

  // Do we want to save ?
  $message = 'Do you want to save all changes ?';
  if (isset($style->active) && $style->active) {
    $message = 'Do you want to save all changes ? All changes will be visible for your visitors.';
  }
  $save = drush_confirm(dt($message));

  // No save.
  if (!$save) {
    drush_print(dt('Saving aborted, but was\'t this jolly good fun ? :)'));
  }

  // Let's save!
  else {
    // Get sweaver plugin styles.
    $sweaver_styles = $sweaver->get_plugin('sweaver_plugin_styles');

    // Save into database.
    $update = array('style_id');

    // Create stylesheet.
    $stylesheet = $style->write_css;
    $stylesheet .= "\n". $style->customcss;

    // Save draft version.
    if (!isset($style->active)) {
      drupal_write_record('sweaver_style_draft', $style, $update);
      $sweaver_styles->sweaver_export_file($stylesheet, $style);
      drush_print(dt('Draft version has been saved.'));
    }

    // Save live version.
    if (isset($style->active)) {
      drupal_write_record('sweaver_style', $style, $update);
      drush_print(dt('Live version has been saved.'));
    }

    // Export css files and set themesettings.
    if (isset($style->active)) {
      $sweaver_styles->sweaver_export_file($stylesheet, $style, 'live');
      if ($data['ts_enabled']) {
        $theme_settings_var = str_replace('/', '_', 'theme_'. $style->theme .'_settings');
        variable_set($theme_settings_var, unserialize($style->themesettings));
      }
    }

    // Flush cache.
    sweaver_clear_cache();
  }
}

/**
 * Print a list of styles.
 *
 * @param $styles
 *   A collection of draft styles.
 */
function sweaver_drush_print_styles($styles) {
  if (empty($styles)) {
    drush_print('No styles found in the system');
  }
  else {
    foreach ($styles as $key => $style) {
      unset($styles[$key]->css);
      unset($styles[$key]->customcss);
      unset($styles[$key]->themesettings);
      $style->style_id = $key;
      if (isset($style->active)) {
        $style->style = $style->style .' '. dt('(live)');
        unset($style->active);
      }
    }
    $rows = array(0 => array(dt('ID'), dt('Theme'), dt('Name')));
    $rows += $styles;
    drush_print_table($rows, TRUE);
  }
}

/**
 * Get the styles available in the system.
 */
function sweaver_drush_list_styles() {
  $styles = array();

  if (module_exists('sweaver')) {

    $i = 1;

    // Draft versions.
    $results = db_query("SELECT * FROM {sweaver_style_draft}")->fetchAll();
    foreach ($results as $row) {
      $styles[$i] = $row;
      $i++;
    }

    // Live versions.
    $results = db_query("SELECT * FROM {sweaver_style} where active = 1")->fetchAll();
    foreach ($results as $row) {
      $styles[$i] = $row;
      $i++;
    }
  }
  else {
    drush_set_context("DRUSH_EXECUTION_COMPLETED", TRUE);
    drush_print('Sweaver is not installed.');
    exit();
  }

  return $styles;
}

/**
 * Set Sweaver variables via Drush.
 *
 * @param $args
 *   Arguments passed by the CLI.
 *
 * @return $mixed
 *   Either a list of styles or start up the editor functionality.
 */
function sweaver_drush_variables() {
  $args = func_get_args();
  $action = sweaver_drush_verify($args, 'variables');

  switch ($action) {
    case 'list':
      drush_print(dt('Your favorite editor is currently @editor.', array('@editor' => variable_get('sweaver_drush_editor', 'vi'))));
      drush_print(dt('Warning message currently set to @warning.', array('@warning' => variable_get('sweaver_drush_warning_edit', 'true'))));
      break;

    case 'save':
      if ($args[0] == 'tmp') {
        variable_set('sweaver_drush_editor', $args[1]);
        drush_print(dt('Temporary directory set to @tmp.', array('@tmp' => $args[1])));
      }
      elseif ($args[0] == 'warning') {
        variable_set('sweaver_drush_warning_edit', $args[1]);
        drush_print(dt('Style warning set to @warning.', array('@warning' => $args[1])));
      }
      else {
        drush_print(dt('The first argument can only be "editor" or "warning"'));
      }
      break;
  }
}

/**
 * Verify arguments.
 *
 * @param $args
 *   A collection of arguments passed by cli.
 * @param $type
 *   Whether we need to verify styles or variables.
 * @return $string
 *   Which action to undertake.
 */
function sweaver_drush_verify($args, $type = 'styles') {
  if (empty($args)) {
    return 'list';
  }

  if ($type == 'styles' && isset($args[0]) && is_numeric($args[0])) {
    return 'edit';
  }

  if ($type == 'variables' && isset($args[0]) && is_string($args[0]) && isset($args[1]) && is_string($args[1])) {
    return 'save';
  }
  else {
    drush_print(dt('Wrong variables supplied.'));
  }
}

/**
 * Verify if drush can write into the sweaver files directory.
 */
function sweaver_drush_verify_edit($style) {
  $write = TRUE;
  $public_path = variable_get('file_public_path', conf_path() . '/files');
  $draft_file = $public_path . '/sweaver/sweaver_' . $style->theme .'_' . $style->style_id . '_draft.css';
  $live_file = $public_path . '/sweaver/sweaver_' . $style->theme .'_' . $style->style_id . '_live.css';
  $touch_file = (isset($style->active)) ? $live_file : $draft_file;
  $write = @touch($touch_file);

  if (!$write) {
    drush_set_context("DRUSH_EXECUTION_COMPLETED", TRUE);
    drush_print(dt('The drush user is not able to overwrite the files in the sweaver directory. Either change the permissions (best option) of those files or run Drush with sudo permissions (might conflict later on when editing the style again from the interface.)'));
    exit();
  }
}

/**
 * Convert the properties which are collected by the editor.
 * They are saved in the database as a JSON object but all
 * properties do not have their pre- and/or suffix on them.
 *
 * @param $css
 *   A collection of properties and values configured by the editor.
 * $return $new_css
 */
function sweaver_drush_json_to_css($css) {
  ctools_include('css');

  $new_css = clone($css);
  $sweaver_properties = sweaver_object_load(NULL, 'property');

  foreach ($css as $selector => $properties) {
    foreach ($properties as $property => $value) {
      if (isset($sweaver_properties[$property])) {

        // Get the property.
        $sp = $sweaver_properties[$property];

        // Add prefixes and suffixes, but skip special cases.
        if (($property == 'background-color' && $value == 'transparent') || ($property == 'background-image' && $value == 'none')) {
          continue;
        }
        $new_value = $sp->property_prefix . $value . $sp->property_suffix;
        $new_css->$selector->$property = $new_value;
      }
    }
  }

  return ctools_css_assemble($new_css);
}

/**
 * Convert the stylesheet back to JSON format.
 *
 * @param $css
 *   A stylesheet.
 * $return $json_css
 */
function sweaver_drush_css_to_json($css) {
  ctools_include('css');

  $json_css = new stdClass;
  $ctools_css = ctools_css_disassemble($css);
  $sweaver_properties = sweaver_object_load(NULL, 'property');

  foreach ($ctools_css as $selector => $properties) {
    foreach ($properties as $property => $value) {
      if (isset($sweaver_properties[$property])) {

        // Get the property.
        $sp = $sweaver_properties[$property];
        // Use str replaces to remove prefixes, suffixes and ;
        $new_value = str_replace(array($sp->property_prefix, $sp->property_suffix, ';'), '', $value);
        $json_css->$selector->$property = $new_value;
      }
    }
  }

  return json_encode($json_css);
}

/**
 * Convert an array to string.
 *
 * @param $array
 *   A collection of key value pairs.
 * @return $string
 */
function sweaver_drush_array_to_string($array) {
  $string = '';

  if (is_string($array)) {
    $array = unserialize($array);
  }

  if (is_array($array) && !empty($array)) {
    foreach ($array as $key => $value) {
      $string .= "$key : $value\n";
    }
  }

  return $string;
}

/**
 * Convert a string to array.
 *
 * @param $array
 *   A collection of key value pairs where the value should be exploded.
 * @return $array
 */
function sweaver_drush_array_lines_to_array_key_values($array) {
  $new_array = array();

  foreach ($array as $key => $line) {
    $key_value = explode(":", $line);
    $new_array_key = trim(array_shift($key_value));
    $new_array_value = trim(implode('', $key_value));
    $new_array[$new_array_key] = $new_array_value;
  }

  return $new_array;
}

/**
 * Warning text.
 *
 * @return $warning
 *   The warning text before editing a style.
 */
function sweaver_drush_warning_text() {
  $warning = '
/////////////////////////////
/// IMPORTANT, PLEASE READ //
/////////////////////////////

You are about to edit a style. This happens in a few steps. You
will get a confirmation question for each step available.
You can remove this warning by typing "drush swv warning false".

Step 1
------
Edit the general css which has been created by the style editor.
Due to the nature that the editor works, not all css properties are
valid, most regareding properties which can take multiple arguments like
margin, padding and border. For instance o do not use padding: 0 3 4 1, but
padding-x: 0; instead. You can always use the custom css of course where
you are free to enter what you like.

Step 2
------
Edit the custom css. You can edit this like a normal stylesheet.

Step 3
------
Edit the themesettings when the themesettings plugin is enabled.
Some values are booleans in the database. So: 0 = false, set to 1 to become true.
It will be presented like this. Do not remove the colons.
$key : $value

Step 4
------
Save the changes you have just performed. Editing a live style will immediately
affect the site for your visitors and will also overwrite the draft version of the style.

Type "y" to continue, "n" to abort.
';

  return dt($warning);
}
