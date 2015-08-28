
(function ($) {
  Drupal.Panels = Drupal.Panels || {};

  Drupal.Panels.autoAttach = function() {
    if ($.browser.msie) {
      // If IE, attach a hover event so we can see our admin links.
      $("div.panel-pane").hover(
        function() {
          $('div.panel-hide', this).addClass("panel-hide-hover"); return true;
        },
        function() {
          $('div.panel-hide', this).removeClass("panel-hide-hover"); return true;
        }
      );
      $("div.admin-links").hover(
        function() {
          $(this).addClass("admin-links-hover"); return true;
        },
        function(){
          $(this).removeClass("admin-links-hover"); return true;
        }
      );
    }
  };

  $(Drupal.Panels.autoAttach);
})(jQuery);
;
(function ($) {

Drupal.behaviors.textarea = {
  attach: function (context, settings) {
    $('.form-textarea-wrapper.resizable', context).once('textarea', function () {
      var staticOffset = null;
      var textarea = $(this).addClass('resizable-textarea').find('textarea');
      var grippie = $('<div class="grippie"></div>').mousedown(startDrag);

      grippie.insertAfter(textarea);

      function startDrag(e) {
        staticOffset = textarea.height() - e.pageY;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        textarea.height(Math.max(32, staticOffset + e.pageY) + 'px');
        return false;
      }

      function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
      }
    });
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.dateYearRange = {};

Drupal.behaviors.dateYearRange.attach = function (context, settings) {
  var $textfield, $textfields, i;

  // Turn the years back and forward fieldsets into dropdowns.
  $textfields = $('input.select-list-with-custom-option', context).once('date-year-range');
  for (i = 0; i < $textfields.length; i++) {
    $textfield = $($textfields[i]);
    new Drupal.dateYearRange.SelectListWithCustomOption($textfield);
  }
};


Drupal.dateYearRange = {};

/**
 * Constructor for the SelectListWithCustomOption object.
 *
 * This object is responsible for turning the years back and forward textfields
 * into dropdowns with an 'other' option that lets the user enter a custom
 * value.
 */
Drupal.dateYearRange.SelectListWithCustomOption = function ($textfield) {
  this.$textfield = $textfield;
  this.$description = $textfield.next('div.description');
  this.defaultValue = $textfield.val();
  this.$dropdown = this.createDropdown();
  this.$dropdown.insertBefore($textfield);
};

/**
 * Get the value of the textfield as it existed on page load.
 *
 * @param {String} type
 *   The type of the variable to be returned. Defaults to string.
 * @return
 *   The original value of the textfield. Returned as an integer, if the type
 *   parameter was 'int'.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.getOriginal = function (type) {
  var original;
  if (type === 'int') {
    original = parseInt(this.defaultValue, 10);
    if (window.isNaN(original)) {
      original = 0;
    }
  }
  else {
    original = this.defaultValue;
  }
  return original;
};

/**
 * Get the correct first value for the dropdown.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.getStartValue = function () {
  var direction = this.getDirection();
  var start;
  switch (direction) {
    case 'back':
      // For the 'years back' dropdown, the first option should be -10, unless
      // the default value of the textfield is even smaller than that.
      start = Math.min(this.getOriginal('int'), -10);
      break;
    case 'forward':
      start = 0;
      break;
  }
  return start;
};

/**
 * Get the correct last value for the dropdown.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.getEndValue = function () {
  var direction = this.getDirection();
  var end;
  var originalString = this.getOriginal();
  switch (direction) {
    case 'back':
      end = 0;
      break;
    case 'forward':
      // If the original value of the textfield is an absolute year such as
      // 2020, don't try to include it in the dropdown.
      if (originalString.indexOf('+') === -1) {
        end = 10;
      }
      // If the original value is a relative value (+x), we want it to be
      // included in the possible dropdown values.
      else {
        end = Math.max(this.getOriginal('int'), 10);
      }
      break;
  }
  return end;
};

/**
 * Create a dropdown select list with the correct options for this textfield.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.createDropdown = function () {
  var $dropdown = $('<select>').addClass('form-select date-year-range-select');
  var $option, i, value;
  var start = this.getStartValue();
  var end = this.getEndValue();
  var direction = this.getDirection();
  for (i = start; i <= end; i++) {
    // Make sure we include the +/- sign in the option value.
    value = i;
    if (i > 0) {
      value = '+' + i;
    }
    // Zero values must have a + or - in front.
    if (i === 0) {
      if (direction === 'back') {
        value = '-' + i;
      }
      else {
        value = '+' + i;
      }
    }
    $option = $('<option>' + Drupal.formatPlural(value, '@count year from now', '@count years from now') + '</option>').val(value);
    $dropdown.append($option);
  }
  // Create an 'Other' option.
  $option = $('<option class="custom-option">' + Drupal.t('Other') + '</option>').val('');
  $dropdown.append($option);

  // When the user changes the selected option in the dropdown, perform
  // appropriate actions (such as showing or hiding the textfield).
  $dropdown.bind('change', $.proxy(this.handleDropdownChange, this));

  // Set the initial value of the dropdown.
  this._setInitialDropdownValue($dropdown);
  return $dropdown;
};

Drupal.dateYearRange.SelectListWithCustomOption.prototype._setInitialDropdownValue = function ($dropdown) {
  var textfieldValue = this.getOriginal();
  // Determine whether the original textfield value exists in the dropdown.
  var possible = $dropdown.find('option[value="' + textfieldValue + '"]');
  // If the original textfield value is one of the dropdown options, preselect
  // it and hide the 'other' textfield.
  if (possible.length) {
    $dropdown.val(textfieldValue);
    this.hideTextfield();
  }
  // If the original textfield value isn't one of the dropdown options, choose
  // the 'Other' option in the dropdown.
  else {
    $dropdown.val('');
  }
};

/**
 * Determine whether this is the "years back" or "years forward" textfield.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.getDirection = function () {
  if (this.direction) {
    return this.direction;
  }
  var direction;
  if (this.$textfield.hasClass('back')) {
    direction = 'back';
  }
  else if (this.$textfield.hasClass('forward')) {
    direction = 'forward';
  }
  this.direction = direction;
  return direction;
};

/**
 * Change handler for the dropdown, to modify the textfield as appropriate.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.handleDropdownChange = function () {
  // Since the dropdown changed, we need to make the content of the textfield
  // match the (new) selected option.
  this.syncTextfield();

  // Show the textfield if the 'Other' option was selected, and hide it if one
  // of the preset options was selected.
  if ($(':selected', this.$dropdown).hasClass('custom-option')) {
    this.revealTextfield();
  }
  else {
    this.hideTextfield();
  }
};

/**
 * Display the textfield and its description.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.revealTextfield = function () {
  this.$textfield.show();
  this.$description.show();
};

/**
 * Hide the textfield and its description.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.hideTextfield = function () {
  this.$textfield.hide();
  this.$description.hide();
};

/**
 * Copy the selected value of the dropdown to the textfield.
 *
 * FAPI doesn't know about the JS-only dropdown, so the textfield needs to
 * reflect the value of the dropdown.
 */
Drupal.dateYearRange.SelectListWithCustomOption.prototype.syncTextfield = function () {
  var value = this.$dropdown.val();
  this.$textfield.val(value);
};

})(jQuery);
;
(function ($) {

/**
 * Toggle the visibility of a fieldset using smooth animations.
 */
Drupal.toggleFieldset = function (fieldset) {
  var $fieldset = $(fieldset);
  if ($fieldset.is('.collapsed')) {
    var $content = $('> .fieldset-wrapper', fieldset).hide();
    $fieldset
      .removeClass('collapsed')
      .trigger({ type: 'collapsed', value: false })
      .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Hide'));
    $content.slideDown({
      duration: 'fast',
      easing: 'linear',
      complete: function () {
        Drupal.collapseScrollIntoView(fieldset);
        fieldset.animating = false;
      },
      step: function () {
        // Scroll the fieldset into view.
        Drupal.collapseScrollIntoView(fieldset);
      }
    });
  }
  else {
    $fieldset.trigger({ type: 'collapsed', value: true });
    $('> .fieldset-wrapper', fieldset).slideUp('fast', function () {
      $fieldset
        .addClass('collapsed')
        .find('> legend span.fieldset-legend-prefix').html(Drupal.t('Show'));
      fieldset.animating = false;
    });
  }
};

/**
 * Scroll a given fieldset into view as much as possible.
 */
Drupal.collapseScrollIntoView = function (node) {
  var h = document.documentElement.clientHeight || document.body.clientHeight || 0;
  var offset = document.documentElement.scrollTop || document.body.scrollTop || 0;
  var posY = $(node).offset().top;
  var fudge = 55;
  if (posY + node.offsetHeight + fudge > h + offset) {
    if (node.offsetHeight > h) {
      window.scrollTo(0, posY);
    }
    else {
      window.scrollTo(0, posY + node.offsetHeight - h + fudge);
    }
  }
};

Drupal.behaviors.collapse = {
  attach: function (context, settings) {
    $('fieldset.collapsible', context).once('collapse', function () {
      var $fieldset = $(this);
      // Expand fieldset if there are errors inside, or if it contains an
      // element that is targeted by the URI fragment identifier.
      var anchor = location.hash && location.hash != '#' ? ', ' + location.hash : '';
      if ($fieldset.find('.error' + anchor).length) {
        $fieldset.removeClass('collapsed');
      }

      var summary = $('<span class="summary"></span>');
      $fieldset.
        bind('summaryUpdated', function () {
          var text = $.trim($fieldset.drupalGetSummary());
          summary.html(text ? ' (' + text + ')' : '');
        })
        .trigger('summaryUpdated');

      // Turn the legend into a clickable link, but retain span.fieldset-legend
      // for CSS positioning.
      var $legend = $('> legend .fieldset-legend', this);

      $('<span class="fieldset-legend-prefix element-invisible"></span>')
        .append($fieldset.hasClass('collapsed') ? Drupal.t('Show') : Drupal.t('Hide'))
        .prependTo($legend)
        .after(' ');

      // .wrapInner() does not retain bound events.
      var $link = $('<a class="fieldset-title" href="#"></a>')
        .prepend($legend.contents())
        .appendTo($legend)
        .click(function () {
          var fieldset = $fieldset.get(0);
          // Don't animate multiple times.
          if (!fieldset.animating) {
            fieldset.animating = true;
            Drupal.toggleFieldset(fieldset);
          }
          return false;
        });

      $legend.append(summary);
    });
  }
};

})(jQuery);
;
(function ($) {

/**
 * Attaches sticky table headers.
 */
Drupal.behaviors.tableHeader = {
  attach: function (context, settings) {
    if (!$.support.positionFixed) {
      return;
    }

    $('table.sticky-enabled', context).once('tableheader', function () {
      $(this).data("drupal-tableheader", new Drupal.tableHeader(this));
    });
  }
};

/**
 * Constructor for the tableHeader object. Provides sticky table headers.
 *
 * @param table
 *   DOM object for the table to add a sticky header to.
 */
Drupal.tableHeader = function (table) {
  var self = this;

  this.originalTable = $(table);
  this.originalHeader = $(table).children('thead');
  this.originalHeaderCells = this.originalHeader.find('> tr > th');
  this.displayWeight = null;

  // React to columns change to avoid making checks in the scroll callback.
  this.originalTable.bind('columnschange', function (e, display) {
    // This will force header size to be calculated on scroll.
    self.widthCalculated = (self.displayWeight !== null && self.displayWeight === display);
    self.displayWeight = display;
  });

  // Clone the table header so it inherits original jQuery properties. Hide
  // the table to avoid a flash of the header clone upon page load.
  this.stickyTable = $('<table class="sticky-header"/>')
    .insertBefore(this.originalTable)
    .css({ position: 'fixed', top: '0px' });
  this.stickyHeader = this.originalHeader.clone(true)
    .hide()
    .appendTo(this.stickyTable);
  this.stickyHeaderCells = this.stickyHeader.find('> tr > th');

  this.originalTable.addClass('sticky-table');
  $(window)
    .bind('scroll.drupal-tableheader', $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    .bind('resize.drupal-tableheader', { calculateWidth: true }, $.proxy(this, 'eventhandlerRecalculateStickyHeader'))
    // Make sure the anchor being scrolled into view is not hidden beneath the
    // sticky table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceAnchor.drupal-tableheader', function () {
      window.scrollBy(0, -self.stickyTable.outerHeight());
    })
    // Make sure the element being focused is not hidden beneath the sticky
    // table header. Adjust the scrollTop if it does.
    .bind('drupalDisplaceFocus.drupal-tableheader', function (event) {
      if (self.stickyVisible && event.clientY < (self.stickyOffsetTop + self.stickyTable.outerHeight()) && event.$target.closest('sticky-header').length === 0) {
        window.scrollBy(0, -self.stickyTable.outerHeight());
      }
    })
    .triggerHandler('resize.drupal-tableheader');

  // We hid the header to avoid it showing up erroneously on page load;
  // we need to unhide it now so that it will show up when expected.
  this.stickyHeader.show();
};

/**
 * Event handler: recalculates position of the sticky table header.
 *
 * @param event
 *   Event being triggered.
 */
Drupal.tableHeader.prototype.eventhandlerRecalculateStickyHeader = function (event) {
  var self = this;
  var calculateWidth = event.data && event.data.calculateWidth;

  // Reset top position of sticky table headers to the current top offset.
  this.stickyOffsetTop = Drupal.settings.tableHeaderOffset ? eval(Drupal.settings.tableHeaderOffset + '()') : 0;
  this.stickyTable.css('top', this.stickyOffsetTop + 'px');

  // Save positioning data.
  var viewHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
  if (calculateWidth || this.viewHeight !== viewHeight) {
    this.viewHeight = viewHeight;
    this.vPosition = this.originalTable.offset().top - 4 - this.stickyOffsetTop;
    this.hPosition = this.originalTable.offset().left;
    this.vLength = this.originalTable[0].clientHeight - 100;
    calculateWidth = true;
  }

  // Track horizontal positioning relative to the viewport and set visibility.
  var hScroll = document.documentElement.scrollLeft || document.body.scrollLeft;
  var vOffset = (document.documentElement.scrollTop || document.body.scrollTop) - this.vPosition;
  this.stickyVisible = vOffset > 0 && vOffset < this.vLength;
  this.stickyTable.css({ left: (-hScroll + this.hPosition) + 'px', visibility: this.stickyVisible ? 'visible' : 'hidden' });

  // Only perform expensive calculations if the sticky header is actually
  // visible or when forced.
  if (this.stickyVisible && (calculateWidth || !this.widthCalculated)) {
    this.widthCalculated = true;
    var $that = null;
    var $stickyCell = null;
    var display = null;
    var cellWidth = null;
    // Resize header and its cell widths.
    // Only apply width to visible table cells. This prevents the header from
    // displaying incorrectly when the sticky header is no longer visible.
    for (var i = 0, il = this.originalHeaderCells.length; i < il; i += 1) {
      $that = $(this.originalHeaderCells[i]);
      $stickyCell = this.stickyHeaderCells.eq($that.index());
      display = $that.css('display');
      if (display !== 'none') {
        cellWidth = $that.css('width');
        // Exception for IE7.
        if (cellWidth === 'auto') {
          cellWidth = $that[0].clientWidth + 'px';
        }
        $stickyCell.css({'width': cellWidth, 'display': display});
      }
      else {
        $stickyCell.css('display', 'none');
      }
    }
    this.stickyTable.css('width', this.originalTable.outerWidth());
  }
};

})(jQuery);
;

/**
 * This is a custom implementation of user.permissions.js, which is necessary
 * because LoginToboggan needs its pre-auth role to not be explicitly tied to
 * the auth role. The change is minor -- simply exclude the pre-auth role from
 * all the auto-checking as the anon and auth user roles are.
 */

(function ($) {

/**
 * Shows checked and disabled checkboxes for inherited permissions.
 */
Drupal.behaviors.permissions = {
  attach: function (context) {
    var self = this;
    $('table#permissions').once('permissions', function () {
      // On a site with many roles and permissions, this behavior initially has
      // to perform thousands of DOM manipulations to inject checkboxes and hide
      // them. By detaching the table from the DOM, all operations can be
      // performed without triggering internal layout and re-rendering processes
      // in the browser.
      var $table = $(this);
      if ($table.prev().length) {
        var $ancestor = $table.prev(), method = 'after';
      }
      else {
        var $ancestor = $table.parent(), method = 'append';
      }
      $table.detach();

      // Create dummy checkboxes. We use dummy checkboxes instead of reusing
      // the existing checkboxes here because new checkboxes don't alter the
      // submitted form. If we'd automatically check existing checkboxes, the
      // permission table would be polluted with redundant entries. This
      // is deliberate, but desirable when we automatically check them.
      var $dummy = $('<input type="checkbox" class="dummy-checkbox" disabled="disabled" checked="checked" />')
        .attr('title', Drupal.t("This permission is inherited from the authenticated user role."))
        .hide();

      $('input[type=checkbox]', this).not('.rid-2, .rid-1, .rid-' + Drupal.settings.LoginToboggan.preAuthID).addClass('real-checkbox').each(function () {
        $dummy.clone().insertAfter(this);
      });

      // Initialize the authenticated user checkbox.
      $('input[type=checkbox].rid-2', this)
        .bind('click.permissions', self.toggle)
        // .triggerHandler() cannot be used here, as it only affects the first
        // element.
        .each(self.toggle);

      // Re-insert the table into the DOM.
      $ancestor[method]($table);
    });
  },

  /**
   * Toggles all dummy checkboxes based on the checkboxes' state.
   *
   * If the "authenticated user" checkbox is checked, the checked and disabled
   * checkboxes are shown, the real checkboxes otherwise.
   */
  toggle: function () {
    var authCheckbox = this, $row = $(this).closest('tr');
    // jQuery performs too many layout calculations for .hide() and .show(),
    // leading to a major page rendering lag on sites with many roles and
    // permissions. Therefore, we toggle visibility directly.
    $row.find('.real-checkbox').each(function () {
      this.style.display = (authCheckbox.checked ? 'none' : '');
    });
    $row.find('.dummy-checkbox').each(function () {
      this.style.display = (authCheckbox.checked ? '' : 'none');
    });
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.fieldPermissionsSettings = {
  attach: function (context) {
    // For user fields, we want the "Create own value for field X" permission
    // row to only be displayed when it's meaningful (i.e., when the "Display
    // on user registration form" checkbox is checked).
    var $user_register_form_checkbox, $required_field_checkbox, $create_permission_row;
    $user_register_form_checkbox = $('.form-item-instance-settings-user-register-form .form-checkbox', context);
    if ($user_register_form_checkbox.length) {
      // The "Required field" checkbox can cause the user registration checkbox
      // to change, so we need it also.
      $required_field_checkbox = $('.form-item-instance-required .form-checkbox', context);
      if ($required_field_checkbox.length) {
        // Get the permissions table row corresponding to the "Create own value
        // for field X" permission. The theme_user_admin_permissions() function
        // does not give us a good way to directly detect which row contains
        // the create permissions, so we have rely on the fact that it will be
        // the first row.
        $create_permission_row = $('table#permissions tbody tr', context).filter(':first');
        new Drupal.fieldPermissions.HideCreatePermission($user_register_form_checkbox, $required_field_checkbox, $create_permission_row);
      }
    }
  }
};

Drupal.fieldPermissions = {};

/**
 * Constructor for the HideCreatePermission object.
 *
 * This object hides and shows the "Create own value for field X" permission
 * for user fields when it is appropriate to do so, depending on the state of
 * the "Display on user registration form" and "Required field" checkboxes.
 */
Drupal.fieldPermissions.HideCreatePermission = function ($user_register_form_checkbox, $required_field_checkbox, $create_permission_row) {
  this.$user_register_form_checkbox = $user_register_form_checkbox;
  this.$create_permission_row = $create_permission_row;
  // Start off by making sure the create permission row has the correct
  // visibility.
  this.setCreatePermissionVisibility();
  // Set the row's visibility again whenever the user registration checkbox
  // changes, or when the required field checkbox (which controls it) changes.
  $user_register_form_checkbox.bind('change', $.proxy(this.setCreatePermissionVisibility, this));
  $required_field_checkbox.bind('change', $.proxy(this.setCreatePermissionVisibility, this));
};

/**
 * Set the correct visibility of the "Create own value for field X" permission.
 */
Drupal.fieldPermissions.HideCreatePermission.prototype.setCreatePermissionVisibility = function () {
  // Granting permissions for "Create own value for field X" only makes sense
  // when the field is configured to appear on the user registration form, so
  // only show the row in the permissions table then.
  if (this.$user_register_form_checkbox.is(':checked')) {
    this.$create_permission_row.show();
  }
  else {
    this.$create_permission_row.hide();
  }
};

})(jQuery);
;
(function ($) {

Drupal.behaviors.dateAdmin = {};

Drupal.behaviors.dateAdmin.attach = function (context, settings) {
  // Remove timezone handling options for fields without hours granularity.
  var $hour = $('#edit-field-settings-granularity-hour').once('date-admin');
  if ($hour.length) {
    new Drupal.dateAdmin.TimezoneHandler($hour);
  }
};


Drupal.dateAdmin = {};

/**
 * Constructor for the TimezoneHandler object.
 *
 * This object is responsible for showing the timezone handling options dropdown
 * when the user has chosen to collect hours as part of the date field, and
 * hiding it otherwise.
 */
Drupal.dateAdmin.TimezoneHandler = function ($checkbox) {
  this.$checkbox = $checkbox;
  this.$dropdown = $('#edit-field-settings-tz-handling');
  this.$timezoneDiv = $('.form-item-field-settings-tz-handling');
  // Store the initial value of the timezone handling dropdown.
  this.storeTimezoneHandling();
  // Toggle the timezone handling section when the user clicks the "Hour"
  // checkbox.
  this.$checkbox.bind('click', $.proxy(this.clickHandler, this));
  // Trigger the click handler so that if the checkbox is unchecked on initial
  // page load, the timezone handling section will be hidden.
  this.clickHandler();
};

/**
 * Event handler triggered when the user clicks the "Hour" checkbox.
 */
Drupal.dateAdmin.TimezoneHandler.prototype.clickHandler = function () {
  if (this.$checkbox.is(':checked')) {
    this.restoreTimezoneHandlingOptions();
  }
  else {
    this.hideTimezoneHandlingOptions();
  }
};

/**
 * Hide the timezone handling options section of the form.
 */
Drupal.dateAdmin.TimezoneHandler.prototype.hideTimezoneHandlingOptions = function () {
  this.storeTimezoneHandling();
  this.$dropdown.val('none');
  this.$timezoneDiv.hide();
};

/**
 * Show the timezone handling options section of the form.
 */
Drupal.dateAdmin.TimezoneHandler.prototype.restoreTimezoneHandlingOptions = function () {
  var val = this.getTimezoneHandling();
  this.$dropdown.val(val);
  this.$timezoneDiv.show();
};

/**
 * Store the current value of the timezone handling dropdown.
 */
Drupal.dateAdmin.TimezoneHandler.prototype.storeTimezoneHandling = function () {
  this._timezoneHandling = this.$dropdown.val();
};

/**
 * Return the stored value of the timezone handling dropdown.
 */
Drupal.dateAdmin.TimezoneHandler.prototype.getTimezoneHandling = function () {
  return this._timezoneHandling;
};

})(jQuery);
;
