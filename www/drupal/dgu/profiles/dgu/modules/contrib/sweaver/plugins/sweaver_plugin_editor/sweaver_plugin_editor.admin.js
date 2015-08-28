/**
 * @file
 * Administration javascript for Sweaver.
 */

(function ($) {

/**
 * This behavior is dependent on the tableDrag behavior, since it uses the
 * objects initialized in that behavior to update the row.
 */
Drupal.behaviors.propertyDrag = {
  attach: function(context) {
    var table = $('table#properties');
    var tableDrag = Drupal.tableDrag.properties;

    // Add a handler so when a row is dropped and no fields are in it, the selection is changed.
    tableDrag.onDrop = function() {
      dragObject = this;
      if ($(dragObject.rowObject.element).prev('tr').is('.container-row')) {
        var container = $(dragObject.rowObject.element).prev('tr').attr('id');
        var container_field = $('select.property-container-select', dragObject.rowObject.element);
        container_field.val(container);
      }
    };
  }
};

})(jQuery);