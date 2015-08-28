
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
/*
 *  Create the splitter, set the viewport size, and set the position of the scrollbar to the first item.
 */
(function($){
  Drupal.behaviors.calendarSetScroll = {
  attach: function(context) {
    // Make multi-day resizable - stolen/borrowed from textarea.js
    $('.header-body-divider:not(.header-body-divider-processed)').each(function() {
      var divider = $(this).addClass('header-body-divider-processed');
      var start_y = divider.offset().top;

      // Add the grippie icon
      $(this).prepend('<div class="grippie"></div>').mousedown(startDrag);

      function startDrag(e) {
        start_y = divider.offset().top;
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        var offset = e.pageY - start_y;
        var mwc = $('#multi-day-container');
        var sdc = $('#single-day-container');
        var mwc_height = mwc.height();
        var sdc_height = sdc.height();
        var max_height = mwc_height + sdc_height;
        mwc.height(Math.min(max_height,Math.max(0,mwc_height + offset)));
        sdc.height(Math.min(max_height,Math.max(0,sdc_height - offset)));
        start_y = divider.offset().top;
        return false;
      }

      function endDrag(e) {
        $(document).unbind("mousemove", performDrag).unbind("mouseup", endDrag);
      }
     });

    $('.single-day-footer:not(.single-day-footer-processed)').each(function() {
      var divider = $(this).addClass('single-day-footer-processed');
      var start_y = divider.offset().top;

      // Add the grippie icon
      $(this).prepend('<div class="grippie"></div>').mousedown(startDrag);

      function startDrag(e) {
        start_y = divider.offset().top;
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
      }

      function performDrag(e) {
        var offset = e.pageY - start_y;
        var sdc = $('#single-day-container');
        sdc.height(Math.max(0,sdc.height() + offset));
        start_y = divider.offset().top;
        return false;
      }

      function endDrag(e) {
        $(document).unbind("mousemove", performDrag).unbind("mouseup", endDrag);
      }
     });

     // Size the window
     calendar_resizeViewport($);
  }
};
})(jQuery);

// Scroll the viewport to the first item
function calendar_scrollToFirst($) {
   if ($('div.first_item').size() > 0 ) {
      var y = $('div.first_item').offset().top - $('#single-day-container').offset().top ;
      $('#single-day-container').scrollTop(y);
   }
}

// Size the single day view
function calendar_resizeViewport($) {
  // Size of the browser window
  var viewportHeight = window.innerHeight ? window.innerHeight : $(window).height();
  var top = $('#single-day-container').offset().top;

  // Give it a 20 pixel margin at the bottom
  //$('#single-day-container').height(viewportHeight - top - 20);
}
;
(function ($) {

/**
 * A progressbar object. Initialized with the given id. Must be inserted into
 * the DOM afterwards through progressBar.element.
 *
 * method is the function which will perform the HTTP request to get the
 * progress bar state. Either "GET" or "POST".
 *
 * e.g. pb = new progressBar('myProgressBar');
 *      some_element.appendChild(pb.element);
 */
Drupal.progressBar = function (id, updateCallback, method, errorCallback) {
  var pb = this;
  this.id = id;
  this.method = method || 'GET';
  this.updateCallback = updateCallback;
  this.errorCallback = errorCallback;

  // The WAI-ARIA setting aria-live="polite" will announce changes after users
  // have completed their current activity and not interrupt the screen reader.
  this.element = $('<div class="progress-wrapper" aria-live="polite"></div>');
  this.element.html('<div id ="' + id + '" class="progress progress-striped active">' +
                    '<div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
                    '<div class="percentage sr-only"></div>' +
                    '</div></div>' +
                    '</div><div class="percentage pull-right"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.progress-bar', this.element).css('width', percentage + '%');
    $('div.progress-bar', this.element).attr('aria-valuenow', percentage);
    $('div.percentage', this.element).html(percentage + '%');
  }
  $('div.message', this.element).html(message);
  if (this.updateCallback) {
    this.updateCallback(percentage, message, this);
  }
};

/**
 * Start monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.startMonitoring = function (uri, delay) {
  this.delay = delay;
  this.uri = uri;
  this.sendPing();
};

/**
 * Stop monitoring progress via Ajax.
 */
Drupal.progressBar.prototype.stopMonitoring = function () {
  clearTimeout(this.timer);
  // This allows monitoring to be stopped from within the callback.
  this.uri = null;
};

/**
 * Request progress data from server.
 */
Drupal.progressBar.prototype.sendPing = function () {
  if (this.timer) {
    clearTimeout(this.timer);
  }
  if (this.uri) {
    var pb = this;
    // When doing a post request, you need non-null data. Otherwise a
    // HTTP 411 or HTTP 406 (with Apache mod_security) error may result.
    $.ajax({
      type: this.method,
      url: this.uri,
      data: '',
      dataType: 'json',
      success: function (progress) {
        // Display errors.
        if (progress.status == 0) {
          pb.displayError(progress.data);
          return;
        }
        // Update display.
        pb.setProgress(progress.percentage, progress.message);
        // Schedule next timer.
        pb.timer = setTimeout(function () { pb.sendPing(); }, pb.delay);
      },
      error: function (xmlhttp) {
        pb.displayError(Drupal.ajaxError(xmlhttp, pb.uri));
      }
    });
  }
};

/**
 * Display errors on the page.
 */
Drupal.progressBar.prototype.displayError = function (string) {
  var error = $('<div class="alert alert-block alert-error"><a class="close" data-dismiss="alert" href="#">&times;</a><h4>Error message</h4></div>').append(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
  }
};

})(jQuery);
;
