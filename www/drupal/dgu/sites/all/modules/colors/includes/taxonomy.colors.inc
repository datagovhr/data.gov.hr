<?php

/**
 * @file
 * Provides Color integration on behalf of taxonomy.module.
 */

/**
 * Implements hook_colors_info().
 */
function taxonomy_colors_info() {
  return array(
    'taxonomy_term' => array(
      'title' => 'Taxonomy term',
      'short_description' => t('Enable this vocabulary'),
      'long_description' => t('Colors on a per-taxonomy basis. After enabling a vocabulary, you can set colors for individual taxonomy terms below.'),
      'function' => '_colors_taxonomy_term_callback',
      'multiple_function' => 'taxonomy_get_vocabularies',
    ),
  );
}

/**
 * Wrapper around taxonomy_get_tree().
 *
 * @param int $vid
 *   The vocabulary ID.
 *
 * @return array
 *  An array keyed by term ID, containing the term name.
 */
function _colors_taxonomy_term_callback($vid) {
  $terms = array();
  foreach (taxonomy_get_tree($vid) as $term) {
    $terms[$term->tid] = $term->name;
  }
  return $terms;
}

/**
 * Implements hook_colors_classes().
 */
function taxonomy_colors_classes($entity) {
  if (!variable_get('colors_taxonomy_term_enabled', FALSE)) {
    return array();
  }

  $filtered_entity = array_intersect_key((array) $entity, field_info_instances($entity->entity_type, $entity->bundle));
  $tids = array();
  foreach ($filtered_entity as $key => $value) {
    foreach ($value as $language => $term) {
      foreach ($term as $content) {
        if (isset($content['tid'])) {
          $tids[] = $content['tid'];
        }
      }
    }
  }

  $class_names = array();
  foreach (taxonomy_get_vocabularies() as $vid => $vocab) {
    if (variable_get('colors_taxonomy_term_' . $vid . '_enabled', FALSE)) {
      // If enabled, get all the terms in the taxonomy.
      foreach (taxonomy_get_tree($vid) as $term) {
        if (in_array($term->tid, $tids)) {
          $class_names[] = 'colors-taxonomy-term-' . $term->tid;
        }
      }
    }
  }
  return $class_names;
}
