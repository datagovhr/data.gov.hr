/* $Id: sweaver_plugin_customcss.js,v 1.1.2.2.2.6 2010/11/06 11:36:02 swentel Exp $ */

(function ($) {

/**
 * Implements Drupal.Sweaver.invokes.processCSS().
 */
Drupal.Sweaver.invokes.customcss = {
  execute: function (context, settings) {
    var fullCss = '';
    fullCss = $('#edit-sweaver-plugin-custom-css').val();
    return fullCss;
  }
};

/**
 * Preview button onclick behavior.
 */
Drupal.behaviors.SweaverCustomCss = {
  attach: function (context) {
    $('#edit-sweaver-plugin-custom-css-button').click(function(){
      Drupal.Sweaver.writeCss();
      Drupal.Sweaver.setMessage(Drupal.t('Your custom css has been succesfully applied.'), 5000);
      return false;
    });
  }
}

})(jQuery);