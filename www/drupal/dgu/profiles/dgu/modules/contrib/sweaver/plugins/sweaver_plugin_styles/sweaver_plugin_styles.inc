<?php
// $Id: sweaver_plugin_styles.inc,v 1.1.2.8.2.21 2010/12/21 14:04:37 swentel Exp $

/**
 * @file
 * Styles plugin.
 */

define('SWEAVER_STYLE_SAVE', 0);
define('SWEAVER_STYLE_SAVE_PUBLISH', 1);
define('SWEAVER_STYLE_PUBLISH', 2);

class sweaver_plugin_styles extends sweaver_plugin {

  /**
   * Menu registry.
   */
  public function sweaver_menu(&$weight, $page_arguments, $base) {

    $items = array();
    $page_arguments = array(
      'plugin' => 'sweaver_plugin_styles',
    );

    // Styles administration.
    $items['admin/config/user-interface/sweaver/styles'] = $base + array(
      'title' => 'Styles',
      'page arguments' => array($page_arguments),
      'type' => MENU_LOCAL_TASK,
      'weight' => $weight++,
    );

    // Delete a style.
    $page_arguments['callback_method'] = 'sweaver_style_confirm_form_delete';
    $items['admin/config/user-interface/sweaver/styles/delete'] = $base + array(
      'title' => 'Delete style',
      'page arguments' => array($page_arguments),
      'type' => MENU_CALLBACK,
    );

    // Autosave callback.
    $base['access arguments'] = array('use editor');
    $page_arguments['callback_method'] = 'sweaver_autosave';
    $items['sweaver-autosave'] = $base + array(
      'title' => 'Autosave',
      'page arguments' => array($page_arguments),
      'type' => MENU_CALLBACK,
    );

    return $items;
  }

  /**
   * Frontend form: add styles form.
   */
  public function sweaver_form() {
    $form = array();
    $form['#popups'] = array();

    // Current style.
    $sweaver = Sweaver::get_instance();
    $current_style = $sweaver->get_current_style();

    // Saved styles in database.
    $existing_styles = FALSE;
    $existing_styles_options = array();
    // Draft versions.
    $drafts = db_query("SELECT style_id, style FROM {sweaver_style_draft} where theme = :theme", array(':theme' => $sweaver->get_theme_key()))->fetchAll();
    foreach ($drafts as $draft) {
      $existing_styles_options[$draft->style_id] = $draft->style;
    }
    if (count($existing_styles_options) > 0) {
      $existing_styles = TRUE;
    }
    // Live versions.
    $lives = db_query("SELECT style_id, style FROM {sweaver_style} where theme = :theme AND active = 1", array(':theme' =>  $sweaver->get_theme_key()))->fetchAll();
    foreach ($lives as $live) {
      $existing_styles_options[$live->style_id] = $live->style;
    }

    // Save popup.
    $form['save_style_popup']['save_style'] = array(
      '#type' => 'textfield',
      '#size' => 50,
      '#weight' => 1,
    );
    if ($existing_styles) {

      // Hide new style name by default.
      $form['save_style_popup']['save_style']['#attributes'] = array('style' => 'display:none');

      $form['save_style_popup']['save_type'] = array(
        '#type' => 'select',
        '#options' => array(
          0 => t('New style'),
          1 => t('Existing style'),
        ),
        '#default_value' => 1,
        '#attributes' => array('class' => array('radio-style-save-type')),
        '#weight' => 0,
      );

      $form['save_style_popup']['style_existing_id'] = array(
        '#type' => 'select',
        '#options' => $existing_styles_options,
        '#default_value' => (isset($current_style->style_id)) ? $current_style->style_id : 0,
        '#weight' => 2,
      );
    }
    else {
      // If no existing styles, set style save type to new.
      $form['save_style_popup']['save_type'] = array(
        '#type' => 'value',
        '#value' => 0,
      );
      $form['save_style_popup']['style_existing_id'] = array(
        '#type' => 'value',
        '#value' => 0,
      );
    }

    // Save buttons for save popup.
    $form['save_style_popup']['save']['save_continue'] = array(
      '#type' => 'submit',
      '#value' => t('Save and continue'),
      '#weight' => 4,
    );
    $form['save_style_popup']['save']['save_publish'] = array(
      '#type' => 'submit',
      '#value' => t('Save and publish'),
      '#weight' => 5,
    );
    $form['save_style_popup']['save']['#weight'] = 10;
    $form['save_style_popup']['save']['#prefix'] = '<div class="save-publish-buttons clearfix">';
    $form['save_style_popup']['save']['#suffix'] = '</div>';

    // Load popup.
    if ($existing_styles) {

      $load_style_options = $existing_styles_options;
      // Add the active versions of a style.
      $active_results = db_query("SELECT style_id, style FROM {sweaver_style} WHERE active = 1")->fetchAll();
      foreach ($active_results as $active) {
        $load_style_options[$active->style_id . '_live_table'] = $active->style . ' (' . t('live') . ')';
      }
      // Fresh start.
      $load_style_options[0] = t('Fresh style');

      $form['load_style_popup']['load_style'] = array(
        '#type' => 'select',
        '#options' => $load_style_options,
      );
      $form['load_style_popup']['load_submit'] = array(
        '#type' => 'submit',
        '#value' => t('Load style'),
      );
    }

    // Publish popup. Make sure we don't save the temporary one.
    if (isset($current_style->style_id) && !empty($current_style->style_id)) {
      $form['publish_style_popup']['publish_style'] = array(
        '#markup' => t('Set style %stylename visible for your visitors. Any unsaved changes will also be saved when publishing.', array('%stylename' => $current_style->style))
      );
      $form['publish_style_popup']['publish_id'] = array(
        '#type' => 'hidden',
        '#value' => $current_style->style_id,
      );
      $form['publish_style_popup']['publish_submit'] = array(
        '#type' => 'submit',
        '#value' => t('Publish style'),
      );
    }

    // Delete popup.
    if ($existing_styles && variable_get('sweaver_styles_delete_tab', FALSE)) {

      // Question.
      $form['delete_style_popup']['question']['delete_style'] = array(
        '#type' => 'select',
        '#options' => $existing_styles_options,
      );
      $form['delete_style_popup']['question']['delete_confirm'] = array(
        '#type' => 'button',
        '#value' => t('Delete'),
      );
      $form['delete_style_popup']['question']['#prefix'] = '<div class="delete-style-confirm">';
      $form['delete_style_popup']['question']['#suffix'] = '</div>';

      // Confirmation.
      $form['delete_style_popup']['warning']['delete_submit'] = array(
        '#type' => 'submit',
        '#value' => t('Delete style'),
      );
      $form['delete_style_popup']['warning']['delete_cancel'] = array(
        '#type' => 'button',
        '#value' => t('Cancel'),
      );
      $form['delete_style_popup']['warning']['#prefix'] = '<div class="delete-style-question clearfix" style="display:none">';
      $form['delete_style_popup']['warning']['#prefix'] .= '<div>'. t('Are you sure you want to delete the style ? All changes and files will be lost. If the style is also active, your visitors will see the default theming.') .'</div>';

      $form['delete_style_popup']['warning']['#suffix'] = '</div>';
    }

    // Build the popup links & content.
    $i = 0;
    $form['#popups_links'] = '';
    $form['#popups_styles'] = array(
      'save_style_popup' => array(
        'title' => t('Save'),
        'description' => 'Save and keep working on your style. You can also publish it immediately for your visitors.',
      ),
      'load_style_popup' => array(
        'title' => t('Load'),
        'description' => t('Load a style to continue working on it. It will only be visible for your visitors after publishing.'),
      ),
      'publish_style_popup' => array(
        'title' => t('Publish'),
        'description' => '',
      ),
      'delete_style_popup' => array(
        'title' => t('Delete'),
        'description' => t('Delete a style which you do not want to use anymore.')
      ),
    );
    foreach ($form['#popups_styles'] as $key => $action) {
      if (isset($form[$key])) {
        ++$i;
        $form['#popups'][] = $key;
        $form['#popups_links'] .= '<div class="style-actions-link"><a href="#" id="style-actions-link-'. $i .'">'. $action['title'] .'</a></div>';
        $form[$key]['#prefix'] = '<div style="display: none;" class="'. str_replace('_', '-', $key) .'" id="style-actions-data-'. $i .'"><h2>'. t('@action style', array('@action' => $action['title'])) .'</h2><p>'. $action['description'] .'</p>';
        $form[$key]['#suffix'] = '</div>';
      }
    }

    return $form;
  }

  /**
   * Frontend form render.
   */
  public function sweaver_form_render(&$vars, &$form, $plugin) {
    $vars['style_actions'] = $form['sweaver_plugin_styles']['form']['#popups_links'];
    $this->sweaver_popups_render($vars, $form, $plugin['name']);
  }

  /**
   * Frontend css and js.
   */
  public function sweaver_form_css_js(&$inline_settings) {
    if (variable_get('sweaver_styles_autosave', 10) > 0) {
      $inline_settings['sweaver']['autosave'] = variable_get('sweaver_styles_autosave', 10);
    }
    drupal_add_js(drupal_get_path('module', 'sweaver') .'/plugins/sweaver_plugin_styles/sweaver_plugin_styles.js');
  }

  /**
   * Frontend form submit.
   */
  public function sweaver_form_submit($form, &$form_state) {
    $sweaver_directory = file_default_scheme() . '://sweaver';
    file_prepare_directory($sweaver_directory, FILE_CREATE_DIRECTORY | FILE_MODIFY_PERMISSIONS);

    $styles_form = $form['sweaver_plugin_styles']['form'];
    $clicked_button = $form_state['clicked_button']['#value'];

    // Save style.
    if ($clicked_button == t('Save and continue') || $clicked_button == t('Save and publish') || $clicked_button == t('Publish style')) {

      // Reset session.
      $this->sweaver_reset_style_session();

      $update = array();
      $style = new stdClass;
      $theme_key = $form['#current_theme'];
      $form_state['publish'] = TRUE;

      // Submit type.
      if ($clicked_button == t('Save and publish')) {
        $submit_type = SWEAVER_STYLE_SAVE_PUBLISH;
      }
      elseif ($clicked_button == t('Publish style')) {
        $submit_type = SWEAVER_STYLE_PUBLISH;
      }
      else {
        $form_state['publish'] = FALSE;
        $submit_type = SWEAVER_STYLE_SAVE;
      }

      // Create variables from form_state, easier to re-use them in the flow.
      $style_name = $form_state['values']['save_style'];
      $keep_working = ($submit_type == SWEAVER_STYLE_PUBLISH) ? FALSE : TRUE;
      $save_type = ($submit_type == SWEAVER_STYLE_PUBLISH) ? TRUE : $form_state['values']['save_type'];
      $style_existing_id = ($submit_type == SWEAVER_STYLE_PUBLISH) ? $form_state['values']['publish_id'] : $form_state['values']['style_existing_id'];

      if ($save_type) {
        $update = array('style_id');
        $style->style_id = $style_existing_id;
        $style->style = $styles_form['save_style_popup']['style_existing_id']['#options'][$style->style_id];
      }
      else {
        $style->style = $style_name;
        if (empty($style->style)) {
          sweaver_session(t('You need to enter a name for your style.'));
          // Reset the clicked button
          $form_state['clicked_button']['#value'] = t('Unknown Sweaver button.');
          return;
        }
      }

      // Always save the draft version.
      $style->theme = $theme_key;
      $style->css = $form_state['values']['sweaver-css'];
      drupal_write_record('sweaver_style_draft', $style, $update);
      $this->sweaver_export_file($form_state['values']['css-rendered'], $style);
      $form_state['style_id'] = $style->style_id;

      // Publish style.
      if ($submit_type == SWEAVER_STYLE_PUBLISH || $submit_type == SWEAVER_STYLE_SAVE_PUBLISH) {
        $style->active = 1;
        $this->sweaver_export_file($form_state['values']['css-rendered'], $style, 'live');
        $message = 'The style @style has been published.';
        db_query("UPDATE {sweaver_style} set active = 0 WHERE theme = :theme", array(':theme' => $style->theme));
        // Find out first if this style already exists or not.
        if (db_query("SELECT style_id FROM {sweaver_style} WHERE style_id = :style_id", array(':style_id' => $style->style_id))->fetchField() === FALSE) {
          $update = array();
        }
        drupal_write_record('sweaver_style', $style, $update);
      }

      // Draft only save.
      if ($submit_type != SWEAVER_STYLE_PUBLISH) {
        sweaver_session(TRUE, 'draft_mode');
        sweaver_session($style->style_id, 'loaded_style');
        sweaver_session('draft', 'loaded_table');
        $message = 'The style @style has been saved. You can keep working on your style.';
      }

      // Draft & published save.
      if ($submit_type == SWEAVER_STYLE_SAVE_PUBLISH)  {
        $message = 'The style @style has been saved and published. You can keep working on your style.';
      }

      sweaver_session(t($message, array('@style' => $style->style)));
    }

    // Load style.
    if ($clicked_button == t('Load style')) {
      // Reset session.
      $this->sweaver_reset_style_session();

      // Build message and session variables.
      $theme_key = $form['#current_theme'];
      $style_id = $form_state['values']['load_style'];
      $style_name = $styles_form['load_style_popup']['load_style']['#options'][$style_id];

      // Load from draft or live table ?
      $table = 'draft';
      $pos = strpos($style_id, '_live_table');
      if ($pos !== FALSE) {
        $table = 'live';
        $style_id = str_replace('_live_table', '', $style_id);
      }

      sweaver_session(TRUE, 'draft_mode');
      sweaver_session($style_id, 'loaded_style');
      sweaver_session($table, 'loaded_table');
      sweaver_session(t('The style @style has been loaded. It is only visible for you.', array('@style' => $style_name)));
    }

    // Delete style.
    if ($clicked_button == t('Delete style')) {

      // Reset session.
      $this->sweaver_reset_style_session();

      // Get info from db and store in form_state so other modules can profit from it.
      $style_id = $form_state['values']['delete_style'];
      $style = db_query("SELECT * FROM {sweaver_style_draft} WHERE style_id = :style_id", array(':style_id' => $style_id))->fetchObject();
      $style_live = db_query("SELECT * FROM {sweaver_style} WHERE style_id = :style_id", array(':style_id' => $style_id))->fetchObject();
      $form_state['style_active'] = isset($style_live->active) ? $style_live->active : FALSE;
      $form_state['style_to_delete'] = $style;

      // Delete entries from tables, files.
      $this->sweaver_delete_style($style);

      // Message.
      $style_name = $styles_form['delete_style_popup']['question']['delete_style']['#options'][$style_id];
      sweaver_session(t('The style @style has been deleted.', array('@style' => $style_name)));
    }

    // Clear page & block cache and page requisites.
    sweaver_clear_cache();
  }

  /**
   * Export css to file.
   */
  public function sweaver_export_file($css, $style, $type = 'draft') {
    $css = str_replace('<style type="text/css">', '', $css);
    $css = str_replace('</style>', '', $css);
    $filename = 'sweaver_' . $style->theme . '_'. $style->style_id .'_'. $type .'.css';

    // Create the css within the files folder.
    $sweaver_directory = file_default_scheme() . '://sweaver';
    file_prepare_directory($sweaver_directory, FILE_CREATE_DIRECTORY | FILE_MODIFY_PERMISSIONS);
    $file = $sweaver_directory . '/' . $filename;
    if (!$fp = fopen($file, 'w')) {
      sweaver_session(t('The css file could not be created.'));
    }
    else {
      // Clean the css before writing it.
      $css = $this->sweaver_ctools_css_filter($css, FALSE);
      fwrite($fp, $css);
    }
    @fclose($fp);
  }

  /**
   * Filter a chunk of CSS text. Based on CTools, but we want the
   * regex for url out. This might become a setting too later.
   */
  function sweaver_ctools_css_filter($css, $compressed = TRUE) {
    ctools_include('css');
    $css_data = ctools_css_disassemble($css);

    $empty_array = array();
    $allowed_properties = $this->sweaver_ctools_allowed_properties();
    $disallowed_values_regex = '/(expression)/';
    $filtered = ctools_css_filter_css_data($css_data, $allowed_properties, $empty_array, '', $disallowed_values_regex);

    return $compressed ? ctools_css_compress($filtered) : ctools_css_assemble($filtered);
  }

  /**
   * Add more allowed properties.
   */
  function sweaver_ctools_allowed_properties() {
    $allowed = ctools_css_filter_default_allowed_properties();
    $allowed_properties = array();
    $exploded = explode("\n", variable_get('sweaver_ctools_allowed_properties', SWEAVER_CTOOLS_ALLOWED_PROPERTIES));
    foreach ($exploded as $key => $class) {
      $trimmed = trim($class);
      if (!empty($trimmed)) {
        $allowed_properties[] = $trimmed;
      }
    }

    return array_merge($allowed, $allowed_properties);
  }

  /**
   * Delete a complete style.
   */
  public function sweaver_delete_style($style) {
    db_query("DELETE FROM {sweaver_style} WHERE style_id = :style_id", array(':style_id' => $style->style_id));
    db_query("DELETE FROM {sweaver_style_draft} WHERE style_id = :style_id", array(':style_id' => $style->style_id));
    $draft = file_default_scheme() . '://sweaver/sweaver_' . $style->theme . '_' . $style->style_id . '_draft.css';
    $live = file_default_scheme() . '://sweaver/sweaver_' . $style->theme . '_' . $style->style_id . '_live.css';
    file_unmanaged_delete($draft);
    file_unmanaged_delete($live);

    // Remove files tied to theme.
    $dir = file_default_scheme() . '://sweaver';
    $mask = '/(.*)' . $style->theme . '_' . $style->style_id . '_(.*)/';
    $files = file_scan_directory($dir, $mask);
    // Get temp files.
    $mask = '/(.*)'. $style->theme .'_temp_(.*)/';
    $files += file_scan_directory($dir, $mask);
    foreach ($files as $key => $file) {
      file_unmanaged_delete($file->uri);
    }
  }

  /**
   * Reset style session.
   */
  public function sweaver_reset_style_session() {
    sweaver_session(NULL, 'loaded_table', TRUE);
    sweaver_session(NULL, 'draft_mode', TRUE);
    sweaver_session(NULL, 'loaded_style', TRUE);
    sweaver_session(NULL, 'sweaver_temp', TRUE);
    ctools_include('object-cache');
    ctools_object_cache_clear('sweaver-styling', 'sweaver-styling');
  }

  /**
   * Menu callback
   */
  public function sweaver_menu_callback() {
    $form = array();

    // Settings.
    $form['sweaver_styles_delete_tab'] = array(
      '#type' => 'checkbox',
      '#title' => t('Show delete tab'),
      '#description' => t('Show the delete tab in the frontend editor.'),
      '#default_value' => variable_get('sweaver_styles_delete_tab', FALSE),
    );
    $form['sweaver_styles_autosave'] = array(
      '#title' => t('Autosave'),
      '#type' => 'select',
      '#options' => array(
        0 => t('Never'),
        5 => t('Every 5 seconds'),
        10 => t('Every 10 seconds'),
        15 => t('Every 15 seconds'),
        30 => t('Every 30 seconds'),
        45 => t('Every 45 seconds'),
        60 => t('Every minute'),
        120 => t('Every two minutes'),
      ),
      '#default_value' => variable_get('sweaver_styles_autosave', 10),
      '#description' => t('Check for changes on your style and custom CSS every x seconds. If a change has been identified, sweaver will save those settings in a temporary cache table with AJAX. So leaving a page - or even worse, a browser crash - will make sure you keep your current configuration.'),
    );
    $form = system_settings_form($form);

    // Styles list.
    $rows = array();
    $styles = db_query("SELECT ssd.*, ss.active FROM {sweaver_style_draft} ssd LEFT JOIN {sweaver_style} ss on ss.style_id = ssd.style_id ORDER BY ssd.style ASC, ssd.theme ASC, ss.active DESC")->fetchAll();
    foreach ($styles as $style) {
      $row = array();
      $row[] = check_plain($style->style);
      $row[] = str_replace('_', ' ', check_plain($style->theme));
      $row[] = ($style->active) ? t('active') : t('inactive');
      $operations = l(t('Delete'), 'admin/config/user-interface/sweaver/styles/delete/'. $style->style_id);
      $row[] = $operations;
      $rows[] = $row;
    }

    if (empty($rows)) {
      $output = '<p>' . t('No styles found.') . '</p>';
    }
    else {

      $header = array(
        t('Style'),
        t('Theme'),
        t('Status'),
        t('Operations'),
      );

      $variables = array(
        'header' => $header,
        'rows' => $rows,
      );

      // Styles list.
      $output = theme('table', $variables);

    }

    $form['item'] = array(
      '#markup' => $output,
    );

    return $form;
  }

  /**
   * Menu callback, delete style.
   */
  public function sweaver_style_confirm_form_delete() {
    $style_id = arg(6);
    $style = db_query('SELECT * FROM {sweaver_style_draft} WHERE style_id = :style_id', array(':style_id' => $style_id))->fetchObject();
    if ($style->style_id) {
      $form['#style'] = $style;
      return confirm_form($form, t('Are you sure you want to delete style %style?', array('%style' => $style->style)), 'admin/settings/sweaver/styles');
    }
    else {
      drupal_set_message(t('Style not found.'));
      drupal_goto('admin/config/user-interface/sweaver/styles');
    }
  }

  /**
   * Submit callback, delete style.
   */
  public function sweaver_style_confirm_form_delete_submit($form, &$form_state) {
    $style = $form['#style'];
    $this->sweaver_delete_style($style);
    sweaver_clear_cache();
    drupal_set_message(t('Style %style has been removed', array('%style' => $form['#style']->style)));
    $form_state['redirect'] = 'admin/config/user-interface/sweaver/styles';
  }

  /**
   * Autosave post.
   */
  public function sweaver_autosave() {
    // Prevent caching of JS output.
    $GLOBALS['conf']['cache'] = FALSE;
    // Prevent Devel from hi-jacking our output in any case.
    $GLOBALS['devel_shutdown'] = FALSE;
    // Load CTools object cache.
    ctools_include('object-cache');

    // Save current styling.
    $style = new stdClass;
    $style->style_id = 0;
    $style->style = t('Temporary');
    $style->css = $_POST['css'];
    $style->customcss = $_POST['customcss'];
    $style->palette = $_POST['palette'];

    // Get the themesettings if applicable and overwrite style id & style name.
    $sweaver = Sweaver::get_instance();
    $working_style = $sweaver->get_current_style();
    if (isset($working_style->themesettings)) {
      $style->theme = $working_style->theme;
      $style->themesettings = $working_style->themesettings;
    }

    // Save to CTools object cache.
    ctools_object_cache_set('sweaver-styling', 'sweaver-styling', $style);

    // Set session variable.
    sweaver_session(TRUE, 'sweaver_temp');

    // Exit.
    exit(drupal_json_encode(array('error' => 0)));
  }
}

