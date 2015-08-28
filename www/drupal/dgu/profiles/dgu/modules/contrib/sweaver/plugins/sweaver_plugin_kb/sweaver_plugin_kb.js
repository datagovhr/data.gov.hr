/* $Id: sweaver_plugin_kb.js,v 1.1.4.6 2010/11/09 13:50:26 swentel Exp $ */

(function ($) {

/**
 * Add key bindings when the Styles plugin is enabled.
 *
 * List of key bindings can be found at
 * http://www.weverwijk.net/wordpress/2010/03/23/key-events-in-javascript/
 * https://github.com/jeresig/jquery.hotkeys
 *
 * More inspiration :
 * - http://rikrikrik.com/jquery/shortkeys/#download
 * - http://code.google.com/p/js-hotkeys/
 * - http://code.google.com/p/js-hotkeys/wiki/about
 */

var kb_popup = '';

/**
 * Bind the keys.
 */
$(document).ready(function() {
  $.each(Drupal.settings.sweaver['kb'], function (index, key_binding) {
    if (key_binding.element != '' && $(key_binding.element).length == 0) {
      return;
    }
    $(document).bind('keydown', key_binding.kb_button, function(event) {
      Drupal.Sweaver.kbShowPopup(event, key_binding);
    });
  });
});

/**
 * Show or close the popup.
 */
Drupal.Sweaver.kbShowPopup = function(event, key_binding) {
  if (event.keyCode == parseInt(key_binding.kb_code) && key_binding.element != '') {
    if (key_binding.kb_button != kb_popup) {
      kb_popup = key_binding.kb_button;
      Drupal.Sweaver.showPopup($(key_binding.element), '400px', '200px');
    }
  }
  else {
    kb_popup = '';
    Drupal.Sweaver.hidePopup();
  }
}

})(jQuery);
