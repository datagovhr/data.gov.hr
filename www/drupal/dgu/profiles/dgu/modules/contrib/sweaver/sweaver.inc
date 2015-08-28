<?php

/**
 * @file
 * Class Sweaver.
 */
class Sweaver {

  private static $instance;
  private $style = NULL;
  private $theme = NULL;
  private $plugins = array();
  private $configured = FALSE;
  private $plugins_registry = array();
  private $plugins_registry_enabled = array();

  /**
	 * Constructor.
	 * Private constructor to make sure this is never
	 * instantiated by the constructor.
   */
  private function __construct() {
    if ($theme_key = sweaver_session(NULL, 'sweaver_theme')) {
      $this->set_current_style($theme_key);
    }
    else {
      $this->set_current_style(variable_get('theme_default', 'garland'));
    }

    if (!$this->is_configured()) {
      $this->register_plugins_configuration();
    }
  }

  /**
   * GetInstance
   * Static method to always return the same object Sweaver.
   * There can only be one Sweaver.
   */
  final static public function get_instance() {
    if (!isset(self::$instance)) {
      self::$instance = new Sweaver();
    }
    return self::$instance;
  }

  /**
   * register_plugins_configuration.
   * Registers an array of plugin configuration data to Sweaver.
   */
  public function register_plugins_configuration() {

    // Load the required plugins of ctools and the sweaver base class.
    ctools_include('plugins');

    // Check if the configuration was cached or not.
    if ($plugins_cache = cache_get('sweaver_plugins')) {
      $this->plugins_registry = $plugins_cache->data['sweaver_plugins'];
      $this->plugins_registry_enabled = $plugins_cache->data['sweaver_plugins_enabled'];
    }
    else {
      $this->plugins_registry = ctools_get_plugins('sweaver', 'plugins');

      // Build enabled plugins.
      foreach ($this->plugins_registry as $key => $plugin) {
        $this->plugins_registry[$key]['enabled'] = 0;
        if (variable_get('sweaver_plugin_status_'. $key, FALSE)) {
          $this->plugins_registry[$key]['enabled'] = 1;
          $this->plugins_registry_enabled[$key] = $this->plugins_registry[$key];
        }
      }

      // Cache the plugins ourselves too.
      $sweaver_plugins['sweaver_plugins'] = $this->plugins_registry;
      $sweaver_plugins['sweaver_plugins_enabled'] = $this->plugins_registry_enabled;
      cache_set('sweaver_plugins', $sweaver_plugins);
    }

    $this->configured = TRUE;

  }

  /**
   * Get the sweaver plugins configurations.
   */
  public function get_plugins_registry($enabled = TRUE) {
    return $enabled ? $this->plugins_registry_enabled : $this->plugins_registry;
  }

  /**
   * is_configured.
   * Tells us if Sweaver is configured.
   */
  public function is_configured() {
    return $this->configured;
  }

  /**
   * add_plugin.
   * Adds a sweaver plugin to the stash.
   */
  private function add_plugin(Sweaver_plugin $plugin) {
    $this->plugins[] = $plugin;
  }
  
  /**
   * is_plugin_activated
   * Check if a plugin is activated
   * @return true if activated
   */
  public function is_plugin_activated($name) {
    if ($this->plugins[$name]) {
      return isset($this->plugins_registry_enabled[$name]);
    }
    return false;
  }

  /**
   * get_plugin.
   * Gets a sweaver plugin, and instantiates it if not loaded yet.
   */
  public function get_plugin($name, $enabled = TRUE) {

    if (!isset($this->plugins_registry[$name])) {
      drupal_set_message(t('No configuration found for @name in the plugin registry', array('@name' => $name)));
    }

    if (!isset($this->plugins[$name])) {

      module_load_include('inc', 'sweaver', 'sweaver_plugin');

      $check = ($enabled) ? isset($this->plugins_registry_enabled[$name]) : TRUE;
      if ($check && $class = ctools_plugin_get_class($this->plugins_registry[$name], 'handler')) {
        // Check that class exists until CTools & registry issues are resolved.
        if (class_exists($class)) {
          $this->plugins[$name] = new $class($this->plugins_registry[$name]);
        }
      }
      else {
        $this->plugins[$name] = FALSE;
      }

    }

    return $this->plugins[$name];
  }

  /**
   * Sets the current style.
   * @param $theme_key
   *   Optional, if missing the global one will be used.
   */
  public function set_current_style($theme_key) {
    $this->theme = $theme_key;
  }

  /**
   * Return a style for a theme.
   *
   * @param $theme
   *   The machine name of the theme.
   * @param $reset
   *   Whether to reset the current $css variable or not.
   * @return $css
   *   The css definition for this theme.
   */
  public function get_current_style($reset = FALSE) {
    $run = &drupal_static('run', FALSE);
    $css = &drupal_static('css', FALSE);

    if (!$run || $reset) {

      $run = TRUE;
      if (sweaver_session(NULL, 'sweaver_temp')) {
        ctools_include('object-cache');
        $css = ctools_object_cache_get('sweaver-styling', 'sweaver-styling');
        if (!isset($css->style_id)) {
          $css = new stdClass();
        }
        $css->type = 'draft';
      }
      elseif (sweaver_session(NULL, 'draft_mode')) {
        $table = (sweaver_session(NULL, 'loaded_table') == 'live') ? 'sweaver_style' : 'sweaver_style_draft';
        $css = db_query("SELECT * FROM {". $table ."} where style_id = :style_id", array(':style_id' => sweaver_session(NULL, 'loaded_style')))->fetchObject();
        if (!isset($css->style_id)) {
          $css = new stdClass();
        }
        $css->type = 'draft';
      }
      else {
        $css = db_query("SELECT style_id, theme, style, css, customcss, palette, themesettings, active FROM {sweaver_style} where theme = :theme and active = 1", array(':theme' => $this->theme))->fetchObject();
        if (!isset($css->style_id)) {
          $css = new stdClass();
        }
        $css->type = 'live';
      }
      if (!isset($css->style_id)) {
        $css = NULL;
      }
    }
    $this->style = $css;
    return $css;
  }

  /**
   * Returns the currently known theme_key.
   */
  public function get_theme_key() {
    return $this->theme;
  }

}
