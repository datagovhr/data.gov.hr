(function ($) {

/**
 * Hook up to page load and overlay to show active sweaver when appropiate.
 */
$(document).ready(function() {
  $(document).bind('drupalOverlayOpen', function() {
    $('a#toolbar-link-admin-sweaver').removeClass('active').parent().removeClass('active-trail active');
  }).bind('drupalOverlayClose', function() {
    $('a#toolbar-link-admin-sweaver').addClass('active').parent().addClass('active-trail active');
    $('ul#toolbar-home a').removeClass('active').parent().removeClass('active-trail active');
  });
  if(!Drupal.overlay.isOpen && !Drupal.overlay.isOpening) {
    $('a#toolbar-link-admin-sweaver').addClass('active').parent().addClass('active-trail active');
    $('ul#toolbar-home a').removeClass('active').parent().removeClass('active-trail active');
  }
});

})(jQuery);