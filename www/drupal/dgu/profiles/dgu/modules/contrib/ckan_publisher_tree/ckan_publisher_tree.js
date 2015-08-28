(function($) {

/**
 * Attaches the tree behavior to the publisher tree widget form.
 */
Drupal.behaviors.ckanPublisherTree = {
  attach: function(context, settings) {
    // Bind the expand/contract button to slide toggle the list underneath.
    $('.ckan-publisher-tree-button', context).once('ckan-publisher-tree-button').click(function() {
      $(this).toggleClass('ckan-publisher-tree-collapsed');
      $(this).siblings('ul').slideToggle('fast');
    });
  }
};
})(jQuery);
