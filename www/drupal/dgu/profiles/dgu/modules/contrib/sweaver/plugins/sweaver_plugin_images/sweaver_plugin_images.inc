<?php

/**
 * @file
 * Images plugin.
 */
class sweaver_plugin_images extends sweaver_plugin {

  /**
   * Menu registry.
   */
  public function sweaver_menu(&$weight, $page_arguments, $base) {

    $items = array();

    $items['admin/config/user-interface/sweaver/images'] = $base + array(
      'title' => 'Images',
      'page arguments' => array($page_arguments),
      'type' => MENU_LOCAL_TASK,
      'weight' => $weight++,
    );
    $page_arguments['callback_method'] = 'sweaver_images_backend_form';
    $items['admin/config/user-interface/sweaver/images/add'] = $base + array(
      'title' => 'Add new image',
      'page arguments' => array($page_arguments),
      'type' => MENU_CALLBACK,
    );
    $page_arguments['callback_method'] = 'sweaver_images_backend_form';
    $items['admin/config/user-interface/sweaver/images/edit'] = $base + array(
      'title' => 'Edit image',
      'page arguments' => array($page_arguments),
      'type' => MENU_CALLBACK,
    );
    $page_arguments['callback_method'] = 'sweaver_images_confirm_form_delete';
    $items['admin/config/user-interface/sweaver/images/delete'] = $base + array(
      'title' => 'Add new image',
      'page arguments' => array($page_arguments),
      'type' => MENU_CALLBACK,
    );

    return $items;
  }

  /**
   * Frontend form: add image form.
   */
  public function sweaver_form() {
    $form = array();

    if (variable_get('sweaver_plugin_images_tab', TRUE)) {
      $form['image_form']['image_description'] = array(
        '#type' => 'textfield',
        '#title' => t('Description'),
        '#description' => t('Description of the image used in the select box for files.')
      );
      $form['image_form']['image_image'] = array(
        '#type' => 'file',
        '#title' => t('Image'),
        '#size' => '40',
        '#description' => t('Upload images which you can use as background images. Extensions are limited to jpg, jpeg, png and gif.<br />Note: there is no scaling on the images on upload.'),
      );
      $form['image_form']['image_submit'] = array(
        '#type' => 'submit',
        '#value' => t('Save image'),
      );
    }

    return $form;
  }

  /**
   * Frontend form submit handler.
   */
  public function sweaver_form_submit($form, &$form_state) {

    if ($form_state['clicked_button']['#value'] == t('Save image')) {

      $validators = array(
        'file_validate_is_image' => array(),
      );

      $sweaver_directory = 'public://sweaver';
      file_prepare_directory($sweaver_directory, FILE_CREATE_DIRECTORY | FILE_MODIFY_PERMISSIONS);
      $image = file_save_upload('image_image', $validators, 'public://sweaver');

      if ($image && !empty($form_state['values']['image_description'])) {
        $image->description = $form_state['values']['image_description'];
        $image_parts = explode('.', $image->uri);
        $extension = array_pop($image_parts);

        $new_image_name = 'public://sweaver/sweaver_image_' . $image->fid . '.' . $extension;
        file_unmanaged_move($image->uri, $new_image_name);

        // Save permanent.
        $image->uri = $new_image_name;
        $image->status = FILE_STATUS_PERMANENT;
        file_save($image);

        drupal_write_record('sweaver_image', $image);
        sweaver_session(t('Image @image has been uploaded.', array('@image' => $image->description)));
      }
      else {

        // Reset error messages.
        $errors = form_get_errors();
        if (!empty($errors)) {
          // Reset messages error.
          unset($_SESSION['messages']['error']);
        }

        // Messages for Sweaver.
        if (empty($form_state['values']['image_description'])) {
          sweaver_session(t('You need to enter a description for the image.'));
        }
        if (!empty($errors)) {
          sweaver_session(t('The image is invalid. Only JPG, PNG and GIF images are allowed.'));
        }
        elseif (!$image) {
          sweaver_session(t('The image is empty.'));
        }
      }
    }
  }

  /**
   * Images handler.
   */
  public function sweaver_images_handler(&$images) {
    $styles = array();
    if (variable_get('sweaver_plugin_images_styles', FALSE) && function_exists('image_styles')) {
      $styles = image_styles();
    }

    $query = 'SELECT ti.fid, ti.description, f.uri FROM {sweaver_image} ti
              INNER JOIN {file_managed} f on f.fid = ti.fid order by description ASC';
    $images_result = db_query($query)->fetchAll();
    global $base_root;
    foreach ($images_result as $image) {
      $images[str_replace($base_root, '', file_create_url($image->uri))] = $image->description;

      // Styles presets.
      foreach ($styles as $preset_key => $preset) {
        $images[image_style_url($preset_key, $image->uri)] = $image->description .' ('. $preset['name'] .')';
      }
    }
  }

  /**
   * Menu callback.
   */
  public function sweaver_menu_callback() {
    $form = array();

    $form['sweaver_plugin_images_tab'] = array(
      '#type' => 'checkbox',
      '#title' => t('Editor tab'),
      '#description' => t('Toggle this checkbox if you want to enable the images tab on the editor.'),
      '#default_value' => variable_get('sweaver_plugin_images_tab', TRUE),
    );

    // Use styles on images ?
    if (function_exists('image_styles')) {
      $form['sweaver_plugin_images_styles'] = array(
        '#type' => 'checkbox',
        '#title' => t('Allow to see styled version of images'),
        '#description' => t('Toggle this checkbox if you want to create styled versions of the images uploaded by the Image plugin.'),
        '#default_value' => variable_get('sweaver_plugin_images_styles', FALSE),
      );
    }
    else {
      $form['style_disabled'] = array(
        '#markup' => '<p>' . t('If you enable the image module, all images can be made available with all style variants.') . '</p>',
      );
      $form['sweaver_plugin_images_styles'] = array(
        '#type' => 'value',
        '#value' => 0,
      );
    }

    $form['sweaver_plugin_handle_images'] = array(
      '#type' => 'hidden',
      '#value' => variable_get('sweaver_plugin_handle_images', 'sweaver_plugin_images'),
    );

    $form = system_settings_form($form);

    // Images list
    $rows = array();
    $output = '<p>'. l(t('Add new image'), 'admin/config/user-interface/sweaver/images/add') .'</p>';

    $query = 'SELECT ti.fid, ti.description, f.uri FROM {sweaver_image} ti
              INNER JOIN {file_managed} f on f.fid = ti.fid order by description ASC';
    $result = db_query($query)->fetchAll();
    foreach ($result as $image) {
      $row = array();
      $row[] = check_plain($image->description);
      $operations = l(t('View'), file_create_url($image->uri)) . ' - ';
      $operations .= l(t('Edit'), 'admin/config/user-interface/sweaver/images/edit/' . $image->fid, array('alias' => TRUE)) . ' - ';
      $operations .= l(t('Delete'), 'admin/config/user-interface/sweaver/images/delete/' . $image->fid, array('alias' => TRUE));
      $row[] = $operations;
      $rows[] = $row;
    }

    if (!empty($rows)) {

      // Output table.
      $header = array(
        t('Image'),
        t('Operations'),
      );
      $variables = array(
        'header' => $header,
        'rows' => $rows,
      );

      $output .= theme('table', $variables);
    }
    else {
      $output .= '<p>' . t('No images uploaded.') . '</p>';
    }

    $form['images_list'] = array(
      '#markup' => $output,
    );

    return $form;
  }

  /**
   * Menu callback submit.
   */
  public function sweaver_menu_callback_submit($form, &$form_state) {
    variable_set('sweaver_plugin_images_styles', $form_state['values']['sweaver_plugin_images_styles']);
    variable_set('sweaver_plugin_images_tab', $form_state['values']['sweaver_plugin_images_tab']);
    variable_set('sweaver_plugin_handle_images', 'sweaver_plugin_images');
    drupal_set_message(t('The configuration options have been saved.'));
  }

  /**
   * Images form.
   */
  public function sweaver_images_backend_form() {
    $form = array();

    $description = '';
    $check_upload = TRUE;
    $image = $this->sweaver_get_image(arg(6));
    if ($image) {
      $check_upload = FALSE;
      $description = $image->description;
      $fid = $image->fid;
    }
    else {
      $fid = NULL;
    }

    $form['#attributes'] = array('enctype' => 'multipart/form-data');
    $form['#fid'] = $fid;
    $form['#check_upload'] = $check_upload;

    $form['image_form']['description'] = array(
      '#type' => 'textfield',
      '#title' => t('Description'),
      '#required' => TRUE,
      '#default_value' => $description,
      '#description' => t('Description of the image used in the select box for files.')
    );
    if (!$fid) {
      $form['image_form']['image'] = array(
        '#type' => 'file',
        '#title' => t('Image'),
        '#description' => t('Upload images which you can use as background images. Extensions are limited to jpg, jpeg, png and gif.<br />Note: there is no scaling on the images on upload.'),
      );
    }
    $form['image_form']['submit'] = array(
      '#type' => 'submit',
      '#value' => t('Save image'),
    );

    return $form;
  }

  /**
   * Images validate.
   */
  public function sweaver_images_backend_form_validate($form, &$form_state) {
    $validators = array(
      'file_validate_is_image' => array(),
    );

    $sweaver_directory = 'public://sweaver';
    file_prepare_directory($sweaver_directory, FILE_CREATE_DIRECTORY | FILE_MODIFY_PERMISSIONS);
    $image = file_save_upload('image', $validators, 'public://sweaver');
    if ($image) {
      $form_state['image'] = $image;
    }
    elseif ($form['#check_upload']) {
      form_set_error('image', t('Image is required'));
    }
  }

  /**
   * Images add submit.
   */
  public function sweaver_images_backend_form_submit(&$form, &$form_state) {
    $image = new stdClass;

    if (isset($form_state['image'])) {
      $image_uploaded = $form_state['image'];
      $image->fid = $image_uploaded->fid;
      $image_parts = explode('.', $image_uploaded->uri);
      $extension = array_pop($image_parts);
      $new_image_name = 'public://sweaver/sweaver_image_' . $image_uploaded->fid . '.' . $extension;
      file_unmanaged_move($image_uploaded->uri, $new_image_name);

      // Resave.
      $image_uploaded->uri = $new_image_name;
      $image_uploaded->status = FILE_STATUS_PERMANENT;
      file_save($image_uploaded);
    }

    if (!isset($image->fid)) $image->fid = $form['#fid'];
    $update = (!$form['#check_upload']) ? array('fid') : array();
    $image->description = $form_state['values']['description'];
    drupal_write_record('sweaver_image', $image, $update);

    drupal_set_message(t('Image %description has been saved.', array('%description' => $image->description)));
    $form_state['redirect'] = 'admin/config/user-interface/sweaver/images';
  }

  /**
   * Image delete form.
   */
  public function sweaver_images_confirm_form_delete() {
    $image = $this->sweaver_get_image(arg(6));
    if ($image) {
      $form['#image'] = $image;
      return confirm_form($form, t('Are you sure you want to delete image %description?', array('%description' => $image->description)), 'admin/config/user-interface/sweaver/images');
    }
    else {
      drupal_set_message(t('Image not found'));
      drupal_goto('admin/config/user-interface/sweaver/images');
    }
  }

  /**
   * Image delete submit callback.
   */
  public function sweaver_images_confirm_form_delete_submit(&$form, &$form_state) {
    $image = $form['#image'];
    file_delete($image);
    db_query("DELETE FROM {sweaver_image} where fid = :fid", array(':fid' => $image->fid));
    drupal_set_message(t('Image %description has been deleted.', array('%description' => $image->description)));
    $form_state['redirect'] = 'admin/config/user-interface/sweaver/images';
  }

  /**
   * Helper function to get image.
   *
   * @param $fid
   *   The file id.
   * @return
   *   False or image object.
   */
  public function sweaver_get_image($fid) {
    if (!empty($fid)) {
      $query = 'SELECT ti.fid, ti.description, f.uri FROM {sweaver_image} ti
                INNER JOIN {file_managed} f on f.fid = ti.fid WHERE f.fid = :fid';
      $image = db_query($query, array(':fid' => $fid))->fetchObject();
      if (isset($image->fid)) {
        return $image;
      }
    }
    return FALSE;
  }
}
