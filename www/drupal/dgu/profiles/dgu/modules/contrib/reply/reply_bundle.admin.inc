<?php

/**
 * @file
 * Project type editing UI.
 */

/**
 * UI controller.
 */
class ReplyBundleUIController extends EntityDefaultUIController {

  /**
   * Overrides hook_menu() defaults.
   */
  public function hook_menu() {
    $items = parent::hook_menu();
    $items[$this->path]['description'] = 'Manage Reply bundles.';
    return $items;
  }
}
