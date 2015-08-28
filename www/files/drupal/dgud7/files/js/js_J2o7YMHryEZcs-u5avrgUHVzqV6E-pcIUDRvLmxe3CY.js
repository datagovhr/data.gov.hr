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

// Registers the rules namespace.
Drupal.rules = Drupal.rules || {};

(function($) {
  Drupal.behaviors.rules_autocomplete = {
    attach: function(context) {
      var autocomplete_settings = Drupal.settings.rules_autocomplete;

      $('input.rules-autocomplete').once(function() {
        var input = this;
        new Drupal.rules.autocomplete(input, autocomplete_settings[$(input).attr('id')]);
      });
    }
  };

  /**
   * Rules autocomplete object.
   */
  Drupal.rules.autocomplete = function(input, settings) {
    this.id = settings.inputId;
    this.uri = settings.source;
    this.jqObject = $('#' + this.id);
    this.cache = new Array();
    this.jqObject.addClass('ui-corner-left');

    this.opendByFocus = false;
    this.focusOpens = true;
    this.groupSelected = false;

    this.button = $('<span>&nbsp;</span>');
    this.button.attr( {
      'tabIndex': -1,
      'title': 'Show all items'
    });
    this.button.insertAfter(this.jqObject);

    this.button.button( {
      icons: {
        primary: 'ui-icon-triangle-1-s'
      },
      text: false
    });

    // Don't round the left corners.
    this.button.removeClass('ui-corner-all');
    this.button.addClass('ui-corner-right ui-button-icon rules-autocomplete-button');

    this.jqObject.autocomplete();
    this.jqObject.autocomplete("option", "minLength", 0);
    // Add a custom class, so we can style the autocomplete box without
    // interfering with other jquery autocomplete widgets.
    this.jqObject.autocomplete("widget").addClass('rules-autocomplete');

    // Save the current rules_autocomplete object, so it can be used in
    // handlers.
    var instance = this;

    // Event handlers
    this.jqObject.focus(function() {
      if (instance.focusOpens) {
        instance.toggle();
        instance.opendByFocus = true;
      }
      else {
        instance.focusOpens = true;
      }
    });

    // Needed when the window is closed but the textfield has the focus.
    this.jqObject.click(function() {
      // Since the focus event happens earlier then the focus event, we need to
      // check here, if the window should be opened.
      if (!instance.opendByFocus) {
        instance.toggle();
      }
      else {
        instance.opendByFocus = false;
      }
    });

    this.jqObject.bind("autocompleteselect", function(event, ui) {
      // If a group was selected then set the groupSelected to true for the
      // overriden close function from jquery autocomplete.
      if (ui.item.value.substring(ui.item.value.length - 1, ui.item.value.length) == ":") {
        instance.groupSelected = true;
      }
      instance.focusOpens = false;
      instance.opendByFocus = false;
    });

    this.jqObject.autocomplete("option", "source", function(request, response) {
      if (request.term in instance.cache) {
        response(instance.cache[request.term]);
        return;
      }
      $.ajax( {
        url: instance.uri + '/' + request.term,
        dataType: "json",
        success: function(data) {
          instance.success(data, request, response);
        }
      });
    });

    // Since jquery autocomplete by default strips html text by using .text()
    // we need our own _renderItem function to display html content.
    this.jqObject.data("autocomplete")._renderItem = function(ul, item) {
      return $("<li></li>").data("item.autocomplete", item).append("<a>" + item.label + "</a>").appendTo(ul);
    };

    // Override close function
    this.jqObject.data("autocomplete").close = function (event) {
      var value = this.element.val();
      // If the selector is not a group, then trigger the close event an and
      // hide the menu.
      if (value === undefined || instance.groupSelected === false) {
        clearTimeout(this.closing);
        if (this.menu.element.is(":visible")) {
          this._trigger("close", event);
          this.menu.element.hide();
          this.menu.deactivate();
        }
      }
      else {
        // Else keep all open and trigger a search for the group.
        instance.jqObject.autocomplete("search", instance.jqObject.val());
        // After the suggestion box was opened again, we want to be able to
        // close it.
        instance.groupSelected = false;
      }
    };

    this.button.click(function() {
      instance.toggle();
    });

  };

  /**
   * Success function for Rules autocomplete object.
   */
  Drupal.rules.autocomplete.prototype.success = function(data, request, response) {
    var list = new Array();
    jQuery.each(data, function(index, value) {
      list.push( {
        label: value,
        value: index
      });
    });

    this.cache[request.term] = list;
    response(list);
  };

  /**
   * Open the autocomplete window.
   * @param searchFor The term for will be searched for. If undefined then the
   *                  entered input text will be used.
   */
  Drupal.rules.autocomplete.prototype.open = function(searchFor) {
    // If searchFor is undefined, we want to search for the passed argument.
    this.jqObject.autocomplete("search", ((searchFor === undefined) ? this.jqObject.val() : searchFor));
    this.button.addClass("ui-state-focus");
  };

  /**
   * Close the autocomplete window.
   */
  Drupal.rules.autocomplete.prototype.close = function() {
    this.jqObject.autocomplete("close");
    this.button.removeClass("ui-state-focus");
  };

  /**
   * Toogle the autcomplete window.
   */
  Drupal.rules.autocomplete.prototype.toggle = function() {
    if (this.jqObject.autocomplete("widget").is(":visible")) {
      this.close();
      this.focusOpens = true;
    }
    else {
      var groups = this.jqObject.val().split(":");
      var selector = "";
      for (var i=0; i<groups.length-1; i++) {
        selector = selector.concat(groups[i]) + ":";
      }
      this.focusOpens = false;
      this.jqObject.focus();
      this.open(selector);
    }
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
