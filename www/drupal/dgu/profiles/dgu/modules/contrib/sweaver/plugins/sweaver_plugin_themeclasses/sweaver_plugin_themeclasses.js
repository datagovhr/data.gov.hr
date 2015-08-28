/* $Id: sweaver_plugin_themeclasses.js,v 1.1.2.5.2.3 2010/11/06 11:36:02 swentel Exp $ */

(function ($) {

/**
 * See if the classes are found on the page.
 */
$(document).ready(function() {
  $('#sweaver_plugin_themeclasses .sweaver-switch-to-style').each(function() {
    var className = $(this).attr('id').replace('spt-', '');
    if ($('.'+ className).length == 0) {
      $(this).hide();
    }
  });
});

/**
 * Switch to style editor and start editing the class.
 */

Drupal.Sweaver.ThemeClasses = function(class_name, class_label) {

  // Switch tabs.
  var remove_tab = 'tab-sweaver_plugin_themeclasses';
  var show_tab = 'tab-sweaver_plugin_editor';
  Drupal.Sweaver.switchTab(remove_tab, show_tab);

  // Update the values for the Style tab.
  class_name = class_name.replace('spt-', '');
  class_label = class_label.replace('spt-', '');  
  Drupal.Sweaver.updateStyleTab(class_name, class_label);
}

})(jQuery);