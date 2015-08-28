// $Id: sweaver_plugin_palettes.js,v 1.1.4.5 2010/11/08 16:03:04 jyve Exp $

/**
 * Add an extra color css
 */

(function ($) {

/**
 * Hook onload behavior
 */
$(document).ready(function() {

  // Check if we need to load the stylesheet when the editor is active.
  var palette = $('#sweaver_plugin_palettes [name=sweaver_plugin_palette]').val();
  console 
  if (palette != '') {
    // Add a external stylesheet container in the head section.
    var link = '<link id="sweaver-palette" href="' + $('#palette-' + palette + ' .file').text() + '" media="all" rel="stylesheet" />';
    $('head').append(link);
  }
  
  $('#sweaver_plugin_palettes .colors').click(function(event) {
    Drupal.Sweaver.changed = true;
    
    var $this = $(this); 
    
    // Remove the stylesheet that was added through jQuery.
    if ($('head link#sweaver-palette').length > 0) {
      $('head link#sweaver-palette').remove();
    } 

    if ($this.hasClass('active')) {
      // Remove the active class.
      $this.removeClass('active'); 
      
      // Reset the active palette.
      $('#sweaver_plugin_palettes [name=sweaver_plugin_palette]').val('');
    }
    else {
	    // Add a external stylesheet container in the head section.
	    var link = '<link id="sweaver-palette" href="' + $('.file', this).text() + '" media="all" rel="stylesheet" />';
	    $('head').append(link);
	    
      // Remove the active classes.
      $('#sweaver_plugin_palettes .active').removeClass('active');
    	    
	    // Add an active class.
	    $this.addClass('active'); 
	    
	    // Set the active palette.
      $('#sweaver_plugin_palettes [name=sweaver_plugin_palette]').val($this.children('.key').text());
	  }
  });
});

})(jQuery);