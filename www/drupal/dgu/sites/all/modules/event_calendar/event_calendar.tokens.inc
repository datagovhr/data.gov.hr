<?php

/**
 * @file
 * Builds placeholder replacement tokens for event_calendar-related data.
 */

/**
 * Implements hook_token_info().
 */
function event_calendar_token_info() {
  $type = array(
    'name' => t('event_calendar'),
    'description' => t('Tokens related to individual content items, or "event_calendars".'),
    'needs-data' => 'event_calendar',
  );

  // Core tokens for event_calendars.
  $event_calendar['start_date'] = array(
    'name' => t("Event start date"),
    'description' => t('The start date of events in event_calendar.'),
  );
  $event_calendar['end_date'] = array(
    'name' => t("Event end date"),
    'description' => t('The start date of events in event_calendar.'),
  );
  $event_calendar['event_status'] = array(
    'name' => t("Event status"),
    'description' => t('The Status of events in event_calendar'),
  );
  $event_calendar['approval_url'] = array(
    'name' => t("Event approval URL"),
    'description' => t('The URL for admin to approve events'),
  );

  return array(
    'types' => array('event_calendar' => $type),
    'tokens' => array('event_calendar' => $event_calendar),
  );
}

/**
 * Implements hook_tokens().
 */
function event_calendar_tokens($type, $tokens, array $data = array(), array $options = array()) {
  $url_options = array('absolute' => TRUE);
  if (isset($options['language'])) {
    $url_options['language'] = $options['language'];
    $language_code = $options['language']->language;
  }
  else {
    $language_code = NULL;
  }
  $sanitize = !empty($options['sanitize']);

  $replacements = array();
  global $base_path;
  if ($type == 'event_calendar' && !empty($data['event_calendar'])) {
    $event_calendar = $data['event_calendar'];
    foreach ($tokens as $name => $original) {
		 switch ($name) {
					// Simple key values on the event_calendar.
					case 'start_date':
						$field_lang_code = field_language('node', $event_calendar, 'event_calendar_date', LANGUAGE_NONE);
						$replacements[$original] = $event_calendar->event_calendar_date[$field_lang_code]['0']['value'];
						break;

					case 'end_date':
						$field_lang_code = field_language('node', $event_calendar, 'event_calendar_date', LANGUAGE_NONE);
						$replacements[$original] = $event_calendar->event_calendar_date[$field_lang_code]['0']['value2'];
						break;

					case 'event_status':
						$field_lang_code = field_language('node', $event_calendar, 'event_calendar_status', LANGUAGE_NONE);
						$term_load = taxonomy_term_load($event_calendar->event_calendar_status[$field_lang_code]['0']['tid']);
						$replacements[$original] = $term_load->name;
						break;

					case 'approval_url':
						$replacements[$original] = url("admin/config/date/manage-events", $url_options);
						break;
		 }
    }
  }

  return $replacements;
}
