<?php


/**
 * @file
 * Session API admin functions.
 */

/**
 * Session API admin settings form.
 */
function session_api_settings_form() {
  // Find modules that implement hook_session_api_cleanup().
  $modules = module_implements('session_api_cleanup');

  // Cookie expiry.
  $form['session_api_cookie_expire_time'] = array(
    '#type' => 'textfield',
    '#title' => t('Cookie expire time'),
    '#description' => t("The <strong>Session API</strong> module sets an additional cookie in the end users' browsers in order to better track sessions across logins and logouts. This is the amount of time, in seconds, that the cookie will stay valid in a user's browser."),
    '#default_value' => variable_get('session_api_cookie_expire_time', 2592000),
  );

  return system_settings_form($form);
}
