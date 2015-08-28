<?php
/**
 * @file
 * dgu_data_set_request.features.menu_links.inc
 */

/**
 * Implements hook_menu_default_menu_links().
 */
function dgu_data_set_request_menu_default_menu_links() {
  $menu_links = array();

  // Exported menu link: menu-data-requests-tabs:data-request
  $menu_links['menu-data-requests-tabs:data-request'] = array(
    'menu_name' => 'menu-data-requests-tabs',
    'link_path' => 'data-request',
    'router_path' => 'data-request',
    'link_title' => 'Najnoviji zahtjevi za podacima',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => 0,
  );
  // Exported menu link: menu-data-requests-tabs:data-request/blogs
  /*$menu_links['menu-data-requests-tabs:data-request/blogs'] = array(
    'menu_name' => 'menu-data-requests-tabs',
    'link_path' => 'data-request/blogs',
    'router_path' => 'data-request/blogs',
    'link_title' => 'ODUG Blogovi',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => 0,
  );*/
  // Exported menu link: menu-data-requests-tabs:data-request/minutes
  /*$menu_links['menu-data-requests-tabs:data-request/minutes'] = array(
    'menu_name' => 'menu-data-requests-tabs',
    'link_path' => 'data-request/minutes',
    'router_path' => 'data-request',
    'link_title' => 'ODUG Minute',
    'options' => array(
      'attributes' => array(
        'title' => '',
      ),
    ),
    'module' => 'menu',
    'hidden' => 0,
    'external' => 0,
    'has_children' => 0,
    'expanded' => 0,
    'weight' => 0,
  );*/
  // Translatables
  // Included for use with string extractors like potx.
  t('Najnoviji zahtijevi za podacima');
  t('ODUG Blogovi');
  t('ODUG Minute');


  return $menu_links;
}
