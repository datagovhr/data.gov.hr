<?php

/**
 * @file
 * The settings file that allows to changes settings regarding emails etc.
 */

require_once "event_calendar.list.inc";

/**
 * Menu callback: Event Calendar configuration.
 */
function event_calendar_settings($form, $form_state) {

  // Creating filter form.
  $form['event_calendar_email_reciepents'] = array(
    '#type' => 'fieldset',
    '#title' => t('Email reciepents'),
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
    '#description' => t('Select the roles who will recieve Email. Admin will recieve Email on creation of a new Event and Other users will recieve when Event is approved. Default super admin will recieve Email on creation of a new Event.'),
  );
  $roles = user_roles();
  unset($roles[DRUPAL_ANONYMOUS_RID]);
  unset($roles[DRUPAL_AUTHENTICATED_RID]);
  $form['event_calendar_email_reciepents']['event_calendar_email_reciepents_list'] = array(
    '#type' => 'checkboxes',
    '#title' => t('Roles'),
    '#options' => $roles,
    '#default_value' => variable_get('event_calendar_email_reciepents_list', array()),
  );

  // Email settings for admin.
  $form['event_calendar_email_admin'] = array(
    '#type' => 'fieldset',
    '#title' => t('Email settings for admin'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
    '#description' => t('Edit the e-mail messages sent to administrator/s. Available variables are: [site:name], [site:url], [node:author], [node:created], [node:title], [node:body], [node:url], [event_calendar:start_date], [event_calendar:end_date], [event_calendar:event_status].'),
  );
  $form['event_calendar_email_admin']['event_calendar_email_admin_subject'] = array(
    '#type' => 'textfield',
    '#title' => t('Subject'),
    '#default_value' => _event_calendar_email_text('admin_subject'),
    '#maxlength' => 180,
  );
  $form['event_calendar_email_admin']['event_calendar_email_admin_body'] = array(
    '#type' => 'textarea',
    '#title' => t('Body'),
    '#default_value' => _event_calendar_email_text('admin_body'),
    '#rows' => 15,
  );

  // Email settings for users.
  $form['event_calendar_email_user'] = array(
    '#type' => 'fieldset',
    '#title' => t('Email settings for users'),
    '#collapsible' => TRUE,
    '#collapsed' => TRUE,
    '#description' => t('Edit the e-mail messages sent to selected user roles. Available variables are: [site:name], [site:url], [node:author], [node:created], [node:title], [node:body], [node:url], [event_calendar:start_date], [event_calendar:end_date], [event_calendar:event_status].'),
  );
  $form['event_calendar_email_user']['event_calendar_email_user_subject'] = array(
    '#type' => 'textfield',
    '#title' => t('Subject'),
    '#default_value' => _event_calendar_email_text('users_subject'),
    '#maxlength' => 180,
  );
  $form['event_calendar_email_user']['event_calendar_email_users_body'] = array(
    '#type' => 'textarea',
    '#title' => t('Body'),
    '#default_value' => _event_calendar_email_text('users_body'),
    '#rows' => 15,
  );

  return system_settings_form($form);
}
