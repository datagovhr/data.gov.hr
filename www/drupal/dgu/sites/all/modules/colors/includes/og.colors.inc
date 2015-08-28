<?php

/**
 * @file
 * Provides Color integration on behalf of og.module.
 */

/**
 * Implements hook_colors_info().
 */
function og_colors_info() {
  return array(
    'og' => array(
      'title' => 'Organic groups',
      'short_description' => t('Enable colors for organic groups'),
      'long_description' => t('Colors for organic groups. If enabled, you may set colors for each node type below.'),
      'function' => '_colors_og_callback',
    ),
  );
}

/**
 * Wrapper around og_get_all_group() and og_label().
 *
 * @return array
 *   An array keyed by group ID, containing the group label.
 */
function _colors_og_callback() {
  $gids = array();
  foreach (og_get_all_group() as $gid) {
    $gids[$gid] = og_label($gid);
  }
  return $gids;
}

/**
 * Implements hook_colors_classes().
 *
 * Provide colors per og type.
 */
function og_colors_classes($entity) {
  $class_names = array();
  if (variable_get('colors_og_enabled', FALSE)) {
    list($id) = entity_extract_ids($entity->entity_type, $entity);
    if (!empty($id)) {
      foreach (og_get_entity_groups($entity->entity_type, $entity) as $gid) {
        $class_names[] = 'colors_og_' . $gid;
      }
    }
  }
  return $class_names;
}
