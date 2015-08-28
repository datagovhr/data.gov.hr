<?php
/**
 * @file
 * dgu_forum.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function dgu_forum_ctools_plugin_api($module = NULL, $api = NULL) {
  if ($module == "context" && $api == "context") {
    return array("version" => "3");
  }
  if ($module == "page_manager" && $api == "pages_default") {
    return array("version" => "1");
  }
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}

/**
 * Implements hook_views_api().
 */
function dgu_forum_views_api($module = NULL, $api = NULL) {
  return array("api" => "3.0");
}

/**
 * Implements hook_node_info().
 */
function dgu_forum_node_info() {
  $items = array(
    'forum' => array(
      'name' => t('Tema foruma'),
      'base' => 'node_content',
      'description' => t('<em>Tema foruma</em> zapo'.unichr3(269).'inje novu diskusiju unutar foruma.'),
      'has_title' => '1',
      'title_label' => t('Subjekt'),
      'help' => '',
    ),
  );
  return $items;
}

function unichr3( $unicode , $encoding = 'UTF-8' ) {
    return mb_convert_encoding("&#{$unicode};", $encoding, 'HTML-ENTITIES');
}