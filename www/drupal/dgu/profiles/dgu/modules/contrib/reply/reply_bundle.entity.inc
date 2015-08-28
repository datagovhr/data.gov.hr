<?php
/**
 * @file
 */

/**
 * Use a separate class for project types so we can specify some defaults
 * modules may alter.
 */
class ReplyBundle extends Entity {

  /**
   * Machine name of the Reply bundle.
   *
   * @var string
   */
  public $bundle;

  /**
   * Human readable name of the Reply bundle.
   *
   * @var string
   */
  public $name;

  /**
   * Access to replies.
   *
   * @var int
   */
  public $access;

  /**
   * Display a flat or threaded list.
   *
   * @var int
   */
  public $display;

  /**
   * The description of this bundle.
   *
   * @var string
   */
  public $description;

  /**
   * Position of the reply form.
   *
   * @var int
   */
  public $form;

  /**
   * Allow replying on replies.
   *
   * @var string
   */
  public $allow_reply;

  /**
   * Project this bundle against any changes of settings or fields by locking
   * it.
   *
   * @var int
   */
  public $locked;

  public function __construct($values = array()) {
    parent::__construct($values, 'reply_bundle');
  }

  /**
   * Returns whether the reply bundle is locked, thus may not be deleted or renamed.
   *
   * Reply bundles provided in code are automatically treated as locked, as well
   * as any fixed reply bundle.
   */
  public function isLocked() {
    return $this->locked || (isset($this->status) && empty($this->is_new) && (($this->status & ENTITY_IN_CODE) || ($this->status & ENTITY_FIXED)));
  }
}
