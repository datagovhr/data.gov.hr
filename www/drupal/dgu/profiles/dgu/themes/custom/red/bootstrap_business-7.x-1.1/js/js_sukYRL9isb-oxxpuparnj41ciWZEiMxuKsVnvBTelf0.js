
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

Drupal.Sweaver = Drupal.Sweaver || {};
Drupal.Sweaver.invokes = Drupal.Sweaver.invokes || {};

Drupal.Sweaver.messageTimer = null;
Drupal.Sweaver.changed = false;
Drupal.Sweaver.popup = '';

Drupal.Sweaver.writeCss = function(context) {

  var fullCss = '';
  $.each(Drupal.Sweaver.invokes, function(func) {
    var css = this.execute();
    if (css != '') {
      fullCss += css;
    }
  });
  $style = $('head style[title="sweaver"]');
  $style.remove();
  $('head').append('<style type="text/css" title="sweaver">' + fullCss + '</style>');
  $('[name=css-rendered]').val(fullCss);

  Drupal.Sweaver.changed = true;
};

$(document).ready(function() {

  // Avoid overlap with the localization client.
  if ($('#l10n-client').length > 0) {
    $('#sweaver').css({'bottom': $('#l10n-client .labels').height()});
  }

  // Gather open/close state and tab information
  Drupal.Sweaver.activeTab = Drupal.Sweaver.cookie('sweaver_active_tab') ? Drupal.Sweaver.cookie('sweaver_active_tab') : $('#sweaver-tabs .tab:first').attr('id');
  $('#' + Drupal.Sweaver.activeTab).addClass('active-tab');
  Drupal.Sweaver.cookie('sweaver_active_tab', Drupal.Sweaver.activeTab);
  Drupal.Sweaver.open = Drupal.Sweaver.cookie('sweaver_open') ? Drupal.Sweaver.cookie('sweaver_open') : 'true';
  Drupal.Sweaver.cookie('sweaver_open', Drupal.Sweaver.open);

  // Add sweaver class for extra margin at bottom.
  if (Drupal.Sweaver.open != 'false') {
    $('body').addClass('sweaver');
  }
  
  // Open/close the Sweaver bar.
  $('#sweaver-tabs .close a').click(function(){
    Drupal.Sweaver.toggleBar($(this).parent());
  });

  // Toggle the horizontal tabs.
  Drupal.Sweaver.container = Drupal.Sweaver.activeTab.substr(4, Drupal.Sweaver.activeTab.length - 4);
  $('#sweaver-tabs .tab a').click(function(){
    Drupal.Sweaver.toggleTabs($(this).parent());
  });

  // Print messages if any
  if ($('[name=sweaver-editor-messages]').val() != '') {
    Drupal.Sweaver.setMessage($('[name=sweaver-editor-messages]').val(), 5000);
  }

  // toggle vertical tabs
  $('#sweaver .vertical-tabs a').click(function(){
    if (!$(this).hasClass('active')) {
      // handle active classes.
      $('#sweaver #' + Drupal.Sweaver.container + ' .vertical-tabs .active').removeClass('active');
      $(this).addClass('active');
      var id = $(this).parent().attr('id').replace('tab-', '');
      $('#sweaver #' + Drupal.Sweaver.container + ' .vertical-content #container-' + id).siblings().hide();
      $('#sweaver #' + Drupal.Sweaver.container + ' .vertical-content #container-' + id).show();
    }
    return false;
  });

});

/**
 * Separate toggle bar function.
 */
Drupal.Sweaver.toggleBar = function (tab) {
  if (Drupal.Sweaver.open == 'false') {
    $('#sweaver-middle').css('height', 'auto');
    tab.removeClass('active-tab');
    $('#sweaver-tabs .close').removeClass('active-tab');
    $('#' + Drupal.Sweaver.activeTab).addClass('active-tab');
    Drupal.Sweaver.open = 'true';
  }
  else {
    $('#sweaver-middle').css("height", 0);
    $('#follow-link').hide();
    Drupal.Sweaver.activeTab =  $('#sweaver-tabs .active-tab').attr('id');
    tab.addClass('active-tab');
    $('#sweaver-tabs .close').addClass('active-tab');
    Drupal.Sweaver.open = 'false';
  }
  // Hide the extra margin at the bottom of the screen.
  $('body').toggleClass('sweaver');

  Drupal.Sweaver.toggleClicked();
  Drupal.Sweaver.cookie('sweaver_open', Drupal.Sweaver.open);
}

/**
 * Separate toggle tabs function.
 */
Drupal.Sweaver.toggleTabs = function (tab) {
  // Get the container that has to be shown.
  var container = tab.attr('id').replace('tab-', '');
  if (container != Drupal.Sweaver.container) {
    //Drupal.Sweaver.toggleBar(tab);
    if (Drupal.Sweaver.open == 'false') {
      $('#sweaver-middle').css("height", 'auto');
      Drupal.Sweaver.open = 'true';
      $('body').addClass('sweaver');
    }
    tab.siblings().removeClass('active-tab');
    tab.toggleClass('active-tab');
    $('#'+ container + ' > div').show();
    $('#'+ Drupal.Sweaver.container + ' > div').hide();
    Drupal.Sweaver.container = container;
  }
  else {
    Drupal.Sweaver.toggleBar(tab);
  }
  Drupal.Sweaver.activeTab =  tab.attr('id');
  Drupal.Sweaver.cookie('sweaver_open', Drupal.Sweaver.open);
  Drupal.Sweaver.cookie('sweaver_active_tab', Drupal.Sweaver.activeTab);
  Drupal.Sweaver.hidePopup();
  Drupal.Sweaver.toggleClicked();
};

/**
 * Separate switch tab function. Takes the tab as arguments and the ID's
 * of the containers will be derived from the tabs.
 */
Drupal.Sweaver.toggleClicked = function () {
  if (Drupal.Sweaver.open == 'true' && Drupal.Sweaver.activeTab == 'tab-sweaver_plugin_editor') {
    // Show the outline on all 'clicked' classes.
    $('.sweaver-clicked-temp').removeClass('sweaver-clicked-temp').addClass('sweaver-clicked');
  }
  else {
    // Hide the outline on all 'clicked' elements
    $('.sweaver-clicked').removeClass('sweaver-clicked').addClass('sweaver-clicked-temp');
  }
}

/**
 * Separate switch tab function. Takes the tab as arguments and the ID's
 * of the containers will be derived from the tabs.
 */
Drupal.Sweaver.switchTab = function (remove_tab, show_tab) {
  var container_remove = remove_tab.replace('tab-', '');
  var container_show = show_tab.replace('tab-', '');

  $('#'+ remove_tab).removeClass('active-tab');
  $('#'+ show_tab).toggleClass('active-tab');
  $('#'+ container_remove + ' > div').hide();
  $('#'+ container_show + ' > div').show();
  Drupal.Sweaver.container = container_show;

  Drupal.Sweaver.activeTab = show_tab;
  Drupal.Sweaver.cookie('sweaver_active_tab', show_tab);
  Drupal.Sweaver.hidePopup();
}

/**
 * Display Sweaver messages.
 */
Drupal.Sweaver.setMessage = function(message, timeout) {
  Drupal.Sweaver.setMessagePosition();
  $('#sweaver-messages .message').html(message);
  $('#sweaver-messages').fadeIn('fast');
  Drupal.Sweaver.messageTimer = window.setTimeout(function() {$('#sweaver-messages').fadeOut('normal');}, timeout);

  // Bind close messages.
  $('#sweaver-messages .close').click(function(){
    $('#sweaver-messages').hide();
    clearTimeout(Drupal.Sweaver.messageTimer);
  });

  // Bind resize on window.
  $(window).resize(function(event){
    Drupal.Sweaver.setMessagePosition();
  });
}

/**
 * Set the position of the message.
 */
Drupal.Sweaver.setMessagePosition = function(){
  messageTop = $(window).height() - $('#sweaver').outerHeight() - $('#sweaver-messages').outerHeight() - 7;
  $('#sweaver-messages').css({'top' : messageTop});
}

/**
 * Display a fullscreen popup.
 */
Drupal.Sweaver.showPopup = function(message, width, height) {
  // Close the previous popup - if any.
  if (Drupal.Sweaver.popup != '') {
    $(Drupal.Sweaver.popup).hide();
  }

  // Create popup.
  popup = $('#sweaver-popup');
  $(message).show();
  Drupal.Sweaver.popup = message;
  Drupal.Sweaver.setPopupSize(popup, width, height);
  popup.fadeIn('fast');

  // Bind close button action.
  $('.close', popup).click(function(){
    $(message).hide();
    Drupal.Sweaver.hidePopup();
  });

  // Bind resize on window if no width or height was given
  // and the popup is full screen.
  if (!width && !height) {
    $(window).bind('resize.Drupal.Sweaver', function(event){
      Drupal.Sweaver.setPopupSize(popup);
    });
  }
}

/**
 * Set the popup width and height.
 */
Drupal.Sweaver.setPopupSize = function(popup, width, height) {
  popupBorder = 7;
  // Reset overflow in case we don't need a scrollbar.
  $('.content', popup).css({'overflow-y' : 'hidden'});

  // Calculate width and height.
  var popupWidth = width ? width : $(window).width() - (popupBorder * 2) - parseInt(popup.css('padding-left')) - parseInt(popup.css('padding-right'));
  var popupHeight = height ? height : $(window).height() - $('#sweaver').outerHeight() - (popupBorder * 2) - parseInt(popup.css('padding-top')) - parseInt(popup.css('padding-bottom'));
  $('.content', popup).css({'height' : popupHeight, 'width' : popupWidth});

  // Center the popup in case a width or height was given.
  var popupLeft = width ? (($(window).width() - parseInt(popupWidth)) / 2) : popupBorder;
  var popupTop = height ? (($(window).height() - parseInt(popupHeight)) / 2) : popupBorder;
  popup.css({'left' : popupLeft + 'px', 'top' : popupTop + 'px'});

  // Add scrollbar if in fullscreen mode.
  if (!height) {
    $('.content', popup).css({'overflow-y' : 'scroll'});
  }
}

/**
 * Hide a popup.
 */
Drupal.Sweaver.hidePopup = function() {
  $('#sweaver-popup').hide();
  $(window).unbind('resize.Drupal.Sweaver');
}

/**
 * Set behaviors on link which will open the popup.
 */
Drupal.behaviors.sweaverOpenPopup = {
  attach: function (context) {
  $('#sweaver .popup-link a').click(function() {
      var wrapper = $(this).attr('id').replace('link', 'data');

      popup = $('#sweaver-popup');
      if (popup.is(':visible') && $(this).hasClass('open-tab')) {
        Drupal.Sweaver.hidePopup();
        $(this).removeClass('open-tab');
      }
      else {
        $('#sweaver .open-style-actions').removeClass('open-style-actions');
        $('#sweaver .open-tab').removeClass('open-tab');
        $(this).addClass('open-tab');
        Drupal.Sweaver.showPopup($('#'+ wrapper));
      }
      return false;
    });

    $('#sweaver .form-submit').click(function() {
      Drupal.Sweaver.hidePopup();
    });

    // Open a popup when clicking on an open/save/delete/publish link.
    $('#sweaver .style-actions-link a').click(function() {
      var wrapper = $(this).attr('id').replace('link', 'data');

      popup = $('#sweaver-popup');
      if (popup.is(':visible') && $(this).hasClass('open-style-actions')) {
        Drupal.Sweaver.hidePopup();
        $(this).removeClass('open-style-actions');
      }
      else {
        $('#sweaver .open-style-actions').removeClass('open-style-actions');
        $('#sweaver .open-tab').removeClass('open-tab');
        $(this).addClass('open-style-actions');
        Drupal.Sweaver.hidePopup();
        Drupal.Sweaver.showPopup($('#'+ wrapper), '400px', '200px');
      }
      return false;
    });
  }
};


/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
Drupal.Sweaver.cookie = function(name, value, options) {
  if (typeof value != 'undefined') { // name and value given, set cookie
    options = options || {};
    if (value === null) {
      value = '';
      options.expires = -1;
    }
    var expires = '';
    if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
      var date;
      if (typeof options.expires == 'number') {
        date = new Date();
        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
      }
      else {
        date = options.expires;
      }
      expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
    }
    // CAUTION: Needed to parenthesize options.path and options.domain
    // in the following expressions, otherwise they evaluate to undefined
    // in the packed version for some reason...
    var path = options.path ? '; path=' + (options.path) : '; path=/';
    var domain = options.domain ? '; domain=' + (options.domain) : '';
    var secure = options.secure ? '; secure' : '';
    document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
  }
  else { // only name given, get cookie
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
};

})(jQuery);;
// $Id: sweaver_plugin_editor.js,v 1.1.2.21.2.20 2010/11/08 16:01:24 jyve Exp $

/**
 * Add the sweaver bar at the bottom of the theme
 */

(function ($) {

Drupal.Sweaver = Drupal.Sweaver || {};

Drupal.Sweaver.types = new Array(); // A type groups different properties.
Drupal.Sweaver.properties = new Array(); // The actual css properties.
Drupal.Sweaver.selectors = new Array(); // The list of defined selector objects.
Drupal.Sweaver.css = new Object(); // Object with all targets and their properties.
Drupal.Sweaver.path = new Array(); // Full path to the root of the document.
Drupal.Sweaver.pathIndexes = new Array(); // An array with the indexes of all selected items.
Drupal.Sweaver.activePath = ''; // Currently active path including pseudo-classes.
Drupal.Sweaver.safeActivePath = ''; // Currently active path excluding pseudo-classes.
Drupal.Sweaver.activeElement = new Object(); // Currently active element.
Drupal.Sweaver.updateMode = true; // should the form updates be saved in css?

/**
 * Hook onload behavior
 */
$(document).ready(function() {

  Drupal.Sweaver.init();

  Drupal.Sweaver.writeCss();

  Drupal.Sweaver.changed = false;

  Drupal.Sweaver.addSliders();

  Drupal.Sweaver.addColorPicker();

  Drupal.Sweaver.updateForm();

  Drupal.Sweaver.bindClicks();
  
  Drupal.Sweaver.LoadPosition();
});

/**
 * Implements Drupal.Sweaver.invokes.processCSS().
 */
Drupal.Sweaver.invokes.editor = {
  execute: function (context, settings) {
    var css = '';
    var fullCss = '';
    var cssContent = '';

    for (var key in Drupal.Sweaver.css) {
      var target = Drupal.Sweaver.css[key];
      var contains_hidden_property = false;
      for (var prop in target) {
        if (Drupal.Sweaver.properties[prop]) {

          var properties = Drupal.Sweaver.properties[prop]['property'].split(' ');
          $.each(properties, function(i, property) {
            // Don't write anything if the value is empty.
            // 0 is not empty!
            if (target[prop]['value'] == '' && target[prop]['value'] != '0') {
              cssContent += '';
            }
            // Don't right anything if the property is hidden
            else if (target[prop]['hidden']) {
              cssContent += '';
              contains_hidden_property = true;
            }
            // Don't add a prefix and suffix for these exceptions.
            else if ((property == 'background-color' && target[prop]['value'] == 'transparent') || (property == 'background-image' && target[prop]['value'] == 'none')) {
              cssContent += '  ' + property + ': ' + target[prop]['value'] + ';\n';
            }
            else {
              cssContent += '  ' + property + ': ' + Drupal.Sweaver.properties[prop].prefix + target[prop]['value'] + Drupal.Sweaver.properties[prop].suffix + ';\n';
            }
          });
        }
      }

      if (cssContent != '' || contains_hidden_property) {
        css += key + '{\n';
        css += cssContent;
        css += '}\n';
        fullCss += css;
        css = '';
        cssContent = '';
      }
      // Remove key from Drupal.Sweaver.css
      else {
        delete Drupal.Sweaver.css[key];
      }
    }

    // Store css in hidden field in save form
    $("#sweaver [name=sweaver-css]").val($.toJSON(Drupal.Sweaver.css));

    // Add inline css
    $("#sweaver-form [name=sweaver-css]").val(fullCss);

    return fullCss;
  }
};

/**
 * Initialize member variables and properties.
 */
Drupal.Sweaver.init = function() {

  // Get previously stored information or create empty object with all targets
  db_css = $("[name=sweaver-css]");
  if (db_css.val() && db_css.val() != '[]'){
    Drupal.Sweaver.css = $.evalJSON(db_css.val());
    
    // Check if values are correctly set
    // If not they are converted in aim to correct depreciated behaviour
    for (key in Drupal.Sweaver.css){
      var target = Drupal.Sweaver.css[key];
      for (prop in target) {
        if (jQuery.type(target[prop]) != 'object'){
          Drupal.Sweaver.css[key][prop] = {
            'value' : Drupal.Sweaver.css[key][prop],
            'hidden' : false,
          };
        }  
      }
    }
    db_css.val('');
  }

  // Get Sweaver selectors.
  Drupal.Sweaver.selectors = Drupal.settings.sweaver['selectors'];

  // Get Sweaver types.
  Drupal.Sweaver.types = Drupal.settings.sweaver['types'];

  // Get Sweaver properties.
  Drupal.Sweaver.properties = Drupal.settings.sweaver['properties'];

  // Get classes that will never be used in the paths or generated css.
  Drupal.Sweaver.excludeClasses = Drupal.settings.sweaver['exclude_classes'];

  // Add a link popup to be able to follow links.
  $('body').append('<a href="#" id="follow-link">' + Drupal.t('Click here to follow this link') + '</a>');
}

/**
 * Get all css values and update the form
 */
Drupal.Sweaver.updateForm = function() {

  // Empty form values and hide unnecessary fields
  Drupal.Sweaver.initForm();

  // Prevent changes from being saved
  Drupal.Sweaver.updateMode = false;

  // Update form with saved settings
  if (Drupal.Sweaver.activePath != '') {
    if ($("#tab-sweaver_plugin_editor").hasClass('active-tab')) {
      $("#sweaver_plugin_editor #sweaver-editor").show();
    }
    var target = '';
    if (!isEmpty(Drupal.Sweaver.activeElement)) {
      var type = Drupal.Sweaver.activeElement.type;
      if (Drupal.Sweaver.types[type]) {
        $.each(Drupal.Sweaver.types[type], function (index, object){
          if (Drupal.Sweaver.properties[object]){
	          var properties = Drupal.Sweaver.properties[object]['property'].split(' ');
	          var tempValue = '';
	          var value = '';
	          $.each(properties, function(i, property) {
	            // Are there pseudo-classes in the active path? If so check the saved css for any values that have been set.
	            // We have do this since jQuery cannot get any values for selectors with pseudo-classes.
	            if (Drupal.Sweaver.safeActivePath != Drupal.Sweaver.activePath && Drupal.Sweaver.css[Drupal.Sweaver.activePath] && Drupal.Sweaver.css[Drupal.Sweaver.activePath][property]['value']) {
                value = Drupal.Sweaver.properties[property].prefix + Drupal.Sweaver.css[Drupal.Sweaver.activePath][property]['value'] + Drupal.Sweaver.properties[property].suffix;
              }
              else {
                value = $(Drupal.Sweaver.safeActivePath).css(property);
              }
	            if (tempValue == '') {
	              tempValue = value;
	            }
	            else {
	              if (tempValue != value) {
	                value = '';
	                return false;
	              }
	            }
	          });
	          if(value != '' && !isEmpty(Drupal.Sweaver.properties[object]) && Drupal.Sweaver.properties[object].type == 'color') {
	            $('#' + object + ' .colorSelector div').css('cssText', 'background-color: ' + value + ' !important;');
	          }
	          else if (value && !isEmpty(Drupal.Sweaver.properties[object]) && Drupal.Sweaver.properties[object].type == 'image') {
                // Remove the url() from around the image url.
	            // Mozilla browsers wrap in url(""), while webkit browsers wrap in url()
	            // so we need two replacements.
	            stripped = value.replace('url("', '').replace('")', '').replace('url(', '').replace(')', '');
                var container = $('#sweaver_plugin_editor #edit-' + object + '-ajax-wrapper .form-managed-file');
                if (1){
                if (stripped != 'none') {
                  container.children('input[type="file"]').hide();
                  container.children('span').remove();
                  
                  container.prepend('<span class="file"><a href="' + stripped + '" target="_blank">' + Drupal.t('Display image') + '</a></span>');

                  container.children('#edit-' + object + '-upload-button').val(Drupal.t('Remove'));
                  container.children('#edit-' + object + '-upload-button').attr('name', object + '_remove_button');
                  container.children('#edit-' + object + '-upload-button').attr('id', 'edit-' + object + '-remove-button');
                }
                else{
                  container.children('input[type="file"]').show();
                  container.children('span').remove();
                  container.children('input[name="' + object + '[fid]"]').val(0);

                  if(container.children('input[type="file"]').length == 0){
                    container.prepend('<input type="file" id="edit-' + object + '-upload" name="files[' + object + ']" size="22" class="form-file" style="display: inline-block; ">');
                  }
                  
                  container.children('#edit-' + object + '-remove-button').val(Drupal.t('Upload'));
                  container.children('#edit-' + object + '-remove-button').attr('name', object + '_upload_button');
                  container.children('#edit-' + object + '-remove-button').attr('id', 'edit-' + object + '-upload-button');
                }
                }
	            //$("#sweaver_plugin_editor #edit-" + object).val(stripped);
	          }
              else if (value && !isEmpty(Drupal.Sweaver.properties[object]) && Drupal.Sweaver.properties[object].type == 'checkbox') // Implement the new field checkbox
              {
                if (Drupal.Sweaver.properties[object]['options'][value] == true)
                    $("#sweaver_plugin_editor #button-checkbox-" + object).addClass('button_active');
                else $("#sweaver_plugin_editor #button-checkbox-" + object).removeClass('button_active')
              }
              else if (value && !isEmpty(Drupal.Sweaver.properties[object]) && Drupal.Sweaver.properties[object].type == 'radio') // Implement the new field radio
	          {
                $("#sweaver_plugin_editor div[id^=button-radio-" + object + "-]").removeClass('button_active');
                $("#sweaver_plugin_editor #button-radio-" + object + '-' + value).addClass('button_active');
	          }
              else {
	            if (value) {
                  if (value.substr(-1) == '%') {
                    // This value is in %
                    // We have to check if this is a correct for this field
                    // If not we will convert this value into px
                    if (!(value in Drupal.Sweaver.properties[object].options)) {
                      //Get first parent width
                      value = $(tempObject).parent().outerWidth() * value.replace('%', '') / 100;
                      value = Math.round(value);
                    }
                  }
                  // Make the sure it is a the string.
                  value = value + '';
	              $("#sweaver_plugin_editor #edit-" + object).val(value.replace('px', ''));
	            }
	          }
          }
        });
      }
    }
  }

  Drupal.Sweaver.updateMode = true;
}

/**
 * Empty form values and hide unnecessary fields.
 */
Drupal.Sweaver.initForm = function() {

  // Hide all sliders, all groups and all containers.
  Drupal.Sweaver.hideOverlays();
  $('#sweaver-editor .sweaver-group').hide();
  $('#sweaver-editor .container').hide();

  if (!isEmpty(Drupal.Sweaver.activeElement)) {
    // Decide which items should be shown or hidden.

    var type = Drupal.Sweaver.activeElement.type;
    $.each(Drupal.Sweaver.properties, function(index, object){
      if(object.name in Drupal.Sweaver.types[type]) {
        $('#sweaver .form-item-' + object.name).show();
        // From the moment that we have an visible element in a group, we need to show that group.
        $('#sweaver .form-item-' + object.name).parents('.sweaver-group').show();
        // From the moment that we have an visible element in a container, we need to show that container.
        $('#sweaver .form-item-' + object.name).parents('.container').show();
      }
      else {
        $('#sweaver .form-item-' + object.name).hide();
      }
    });
  }
}

/**
 * Show colorPicker and hook events to it
 */
Drupal.Sweaver.addColorPicker = function() {
  $('#sweaver .colorSelector').each(function() {
    var object = $(this);
    var property = object.parent().attr('id');
    object.ColorPicker({
      color: '#ffffff',
      // Determine the current color and send it to colorpicker.
      onBeforeShow: function () {
        var current_color_object = {};
        var current_color_value = ($('div', this).css('background-color')).replace('rgba(', '').replace('rgb(', '').replace(')', '').split(',');
        if (current_color_value[0] != 'transparent') {
          current_color_object.r = current_color_value[0];
          current_color_object.g = current_color_value[1];
          current_color_object.b = current_color_value[2];
          $(this).ColorPickerSetColor(current_color_object);
        }
        else {
          current_color_object.r = '255';
          current_color_object.g = '255';
          current_color_object.b = '255';
          $(this).ColorPickerSetColor(current_color_object);
        }
      },
      onShow: function (colpkr) {
        $(colpkr).fadeIn(500);
        if (object.parents('.sweaver-group-content').length == 0) {
          Drupal.Sweaver.hideOverlays();
        }
        return false;
      },
      onHide: function (colpkr) {
        $(colpkr).fadeOut(500);
        return false;
      },
      onChange: function (hsb, hex, rgb) {
      var preview = hex;
      if (hex != 'transparent') {
        preview = '#'+ hex;
      }
        $('div', object).css('cssText', 'background-color:' + preview + '!important;');
        if (Drupal.Sweaver.updateMode) {
          Drupal.Sweaver.setValue(property, hex);
        }
      }
    });
  });
}

/*
 * Add sliders through jQuery UI
 */
Drupal.Sweaver.addSliders = function() {
  $("#sweaver .slider-value").each(function() {
    $(this).after('<div class="slider-wrapper"><div id="' + $(this).attr('id').substr(5, $(this).attr('id').length - 5) + '-slider" class="slider"></div></div>');
  });

  // Move the slider to the right position on show.
  $("#sweaver .slider-value").click(function() {
    Drupal.Sweaver.updateMode = false;
    $(this).siblings('.slider-wrapper').children().slider("option", "value", $(this).val());
    Drupal.Sweaver.updateMode = true;
  });

  $("#sweaver .slider").each(function() {
    id = $(this).attr('id').replace('-slider', '');
    var minSlider = Drupal.Sweaver.properties[id].slider_min;
    if (minSlider == null || minSlider == '') {
      minSlider = 0;
    }
    var maxSlider = Drupal.Sweaver.properties[id].slider_max;
    if (maxSlider == null || maxSlider == '') {
      maxSlider = 2000;
    }
    $(this).slider({
      min: minSlider,
      max: maxSlider,
      slide: function(event, ui) {
        id = $(this).attr("id").replace('-slider','');
        $('#edit-' + id).val(ui.value);
        if (Drupal.Sweaver.updateMode) {
          Drupal.Sweaver.setValue(id, ui.value);
        }
      }
    });
  });
  
  //Double clicking on a slider delete all modifications made through the editor to the property
  $('#sweaver .slider a').bind('dblclick', function(){
    property = $(this).parent().attr('id').replace('-slider', '');
    Drupal.Sweaver.deleteProperty(Drupal.Sweaver.activePath, property);
  });
}

/**
 * Loop through all clickable area's and bind click
 */
Drupal.Sweaver.bindClicks = function() {

  // Get a list of selectors to exclude.
  var excludes = Drupal.settings.sweaver['exclude_selectors'];

  // Add hover outline object.
  $('#sweaver-frontend').append('<div style="position: absolute; top: 0; left: 0; border: 2px dotted #ccc" id="#sweaver-hover"></div>');

  // Build an object with all the elements that can be hovered/clicked
  var tempSelectors = $('body').find('*').filter(':parents(' + excludes + '):not(' + excludes + ')');

  // When an element is hovered, add a class 'sweaver-hovered'.
  if (Drupal.settings.sweaver['preview_selector']) {
    tempSelectors
    .bind('mouseenter', function(event){
      // Only do something when the content area is visible.
      if (Drupal.Sweaver.visible()) {
        tempObject = $(this);
        object = Drupal.Sweaver.buildSweaverObject(tempObject);
        // Loop through the selectors to see if the current item should be selectable.
        if (!object.translation[0]) {
          $.each(tempObject.parents(), function() {
            tempObject = $(this);
            object = Drupal.Sweaver.buildSweaverObject(tempObject);
            if (object.translation[0]) {
              return false;
            }
          });
        }
        // Make sure only one item has the outline.
        $('.sweaver-hovered').removeClass('sweaver-hovered');

        // Don't add the class on elements that cover the entire screen
        // since that would add a, annoying horizontal scrollbar.
        
        // There is actually a bug reguarding WebKit and outerHeight/outerWidth property
        // In aim to make it work we have to shortly change the display to inline-block
        var originalDisplay = tempObject.css('display');
        tempObject.css('display', 'inline-block');
        if (tempObject.outerWidth() != $(window).width()) {
          tempObject.addClass('sweaver-hovered');
        }
        tempObject.css('display', originalDisplay);
      }
    })
    .bind('mouseleave', function(event){
      // Loop through the selectors to see if the current item should be selectable.
      if (Drupal.Sweaver.visible()) {
        tempObject = $(this);
        tempObject.removeClass('sweaver-hovered');

        $.each(tempObject.parents(), function() {
          tempObject = $(this);
          object = Drupal.Sweaver.buildSweaverObject(tempObject);
          if (object.translation[0]) {
            return false;
          }
        });
        var originalDisplay = tempObject.css('display');
        tempObject.css('display', 'inline-block');
        if (tempObject.outerWidth() != $(window).width()) {
          tempObject.addClass('sweaver-hovered');
        }
        tempObject.css('display', originalDisplay);
      }
    });
  }

  // When an element is clicked, add a class and build the entire path.
  tempSelectors
  .bind('click', function (event) {
    // Only do something when the content area is visible.
    if (Drupal.Sweaver.visible()) {

      // We need to use event.target here as we need to know if we clicked on an element that should be excluded.
      // If we don't do this, then we will get the parent element of the excluded element, which is not what we want.
      tempObject = $(event.target);
      
      Drupal.Sweaver.editSelection(tempObject, event);
    }
  });

  // Hide sliders and close groups when clicking outside of them.
  $("#sweaver").click(function() {
    Drupal.Sweaver.hideOverlays();
  });

  // Update css when a fake checkbox is clicked
  $("#sweaver_plugin_editor div[id^=button-checkbox-]").click(function(){
    if ($(this).hasClass('button_active'))
      $(this).removeClass('button_active');
    else $(this).addClass('button_active');
    
    if (Drupal.Sweaver.updateMode) {
      var status = $(this).hasClass('button_active');
      var property_to_update = $(this).attr('id').replace('button-checkbox-', '');
        
      $.each(Drupal.Sweaver.properties[property_to_update]['options'], function(key, value) { 
        if (value == status)
          Drupal.Sweaver.setValue(property_to_update, key);
      });
    }
  });
  
  // Update css when a fake radio button is clicked
  $("#sweaver_plugin_editor div[id^=button-radio-]").click(function(){
    var property_to_update = $(this).attr('name');
    var value = $(this).attr('id').replace('button-radio-' + property_to_update + '-', '');
    $("#sweaver_plugin_editor div[id^=button-radio-" + property_to_update + "-]").removeClass('button_active');
    $(this).addClass('button_active');
    
    if (Drupal.Sweaver.updateMode) {
        Drupal.Sweaver.setValue(property_to_update, value);
    }
  });
  
  //Double clicking on a radio button delete all modifications made through the editor to the property
  $("#sweaver_plugin_editor div[id^=button-radio-]").bind('dblclick', function(){
    property = $(this).attr('name');
    Drupal.Sweaver.deleteProperty(Drupal.Sweaver.activePath, property);
  });

  // Update css when something (that is not checkbox or radio button) is changed in the form.
  $("#sweaver_plugin_editor input[id^=edit-], #sweaver_plugin_editor select[id^=edit-]").live('change', function(){
    if (Drupal.Sweaver.updateMode) {
      // Is this a file input ?
      if ($(this).attr('name').match('^files\[[a-zA-Z0-9_-]+\]')){
        var name = $(this).attr('name').substr(6, $(this).attr('name').length - 7);
        var button = $('#' + $(this).attr('id') + '-button');
        button.trigger('click');
        button.trigger('mousedown');    
          
        // this function check every second if the image selected has been uploaded
        (function imageValueChecker (i) {  
          var fidInput = $('#sweaver_plugin_editor input[name="' + name + '[fid]"]');
          setTimeout(function () {  
          if (fidInput.val() != 0 ){
          // Download complete
          // We proceed of the css update
            $('#edit-' + name + '-ajax-wrapper').ajaxSuccess(function(evt, request, settings){
              window.location.reload();
            });
            absolute_path = fidInput.siblings('.file').children('a').attr('href');
            relative_path = absolute_path.replace(Drupal.settings.sweaver['base_root'], '');
            Drupal.Sweaver.setValue(name ,relative_path);
            Drupal.Sweaver.SavePosition();
            Drupal.Sweaver.AutoSave();
          }               
          if (fidInput.val() == 0 && --i) imageValueChecker(i);      //  decrement i and call myLoop again if i > 0
          }, 1000);
        })(15); // If 15 seconds after the beginning of the upload it is not yet finished we can assume that there has been a problem.
      }
      else {
        Drupal.Sweaver.setValue($(this).attr('name'), $(this).val());
      }
    }
  });
  
  $('#sweaver_plugin_editor .form-managed-file input[type=submit]').live('mouseover', function(){
    if(!$(this).hasClass('event_added')){
      $(this).addClass('event_added');
      $(this).bind('mousedown', function(){
        Drupal.Sweaver.setValue($(this).attr('name').replace('_remove_button', ''), 'none');
      });
    }
  });
  
  // Show the slider when a numeric value is entered.
  $("#sweaver_plugin_editor  .slider-value").click(function(event){
    event.stopPropagation();
    $slider = $(this).siblings('.slider-wrapper');

    if ($slider.css('visibility') == 'visible') {
      // Add an active class for IE position issues.
      $slider.parent().removeClass('active');
      $slider.parents('.sweaver-group').removeClass('active');

      // Close slider again on second click.
      $slider.css({'visibility' : 'hidden'});
    }
    else {
      // Hide all other sliders.
      $('#sweaver_plugin_editor .slider-wrapper').css({'visibility' : 'hidden'});

      // Add an active class for IE position issues.
      $('#sweaver_plugin_editor .form-item, #sweaver_plugin_editor .sweaver-group').removeClass('active');
      $slider.parent().addClass('active');
      $slider.parents('.sweaver-group').addClass('active');
      
      var container = $(this).parent().parent();      
      var top =  $slider.outerHeight();
      var left = -($slider.width() / 2) + ($(this).outerWidth() / 2);
      
      if ($slider.siblings('label').is(':visible')) {
        left += $slider.siblings('label').width();
      }
      else if (container.hasClass('side')) {
        left += $(this).offset().left - container.offset().left;      
      }
      
      // Flip the slider over the input when it is too close to the bottom of the page to be displayed
      if ($('#sweaver').offset().top + $('#sweaver').height() - $(this).offset().top < 100) {
        top = 0 - top - 5;
      }  
      
      $slider.css({'left' : left, 'top' : top}).css({'visibility' : 'visible'});
    }
  });
  
  // The value of an input field can be modified with arrows
  $("#sweaver_plugin_editor  .slider-value").keydown(function(event){
    var value = $(this).val();
    switch(event.keyCode) {
      case 37:
      case 40:
        value--;
        $(this).val(value);
        Drupal.Sweaver.setValue($(this).attr('name'), value);
        break;
      
      case 38:
      case 39:
        value++;
        $(this).val(value);
        Drupal.Sweaver.setValue($(this).attr('name'), value);
        break;
    }
  });

}

/**
 * Load an object to the editor from a selector
 */
Drupal.Sweaver.editSelection = function (tempObject, event) {
  clicked_object = (event == null) ? false : true;
  if (!tempObject.parents(Drupal.settings.sweaver['exclude_selectors']).length > 0) {
    if (clicked_object) {
      event.stopPropagation();
    }

    object = Drupal.Sweaver.buildSweaverObject(tempObject);
    
    // If the clicked object is a link, or an element in a link, prevent default behavior.
    $('#follow-link').hide();
    if (object.tag == 'a' || tempObject.parents('a').length > 0) {
      var position = tempObject.offset();
      var clickObject = tempObject;
      if (object.tag != 'a') {
        clickObject = tempObject.parents('a');
      }
      if (object.id != 'follow-link') {
        $('#follow-link').attr('href', clickObject.attr('href')).css({
          'top': position.top + clickObject.outerHeight() + 5,
          'left': position.left
        }).fadeIn();
        if (clicked_object) {
          event.preventDefault();
        }
      }
    }
    // If the clicked object is a button prevent default behavior.
    if ((object.tag == 'input' || object.tag == 'label') && clicked_object) {
      event.preventDefault();
    }

    // Don't do anything if the clicked object is the 'follow-link' link.
    if (object.id != 'follow-link') {

      // Only do something if the clicked item is found in the selectors.
      if (!object.translation[0]) {
        $.each(tempObject.parents(), function () {
          tempObject = $(this);
          object = Drupal.Sweaver.buildSweaverObject(tempObject);
          if (object.translation[0]) {
            return false;
          }
        });
      }
      
      // Prevent from selecting non modifiable selectors
      if (!object.translation[0]) {
        return false;
      }

      // clear the old paths.
      $('#sweaver_plugin_editor .sweaver-header').html('<div id="full-path" class="clearfix"></div><div id="selected-path" class="clear-block"></div>');

      // Reset some values.
      Drupal.Sweaver.path.length = 0;
      Drupal.Sweaver.pathIndexes.length = 0;
      $("#selected-path").html('<span class="path-label">' + Drupal.t('Selected item: ') + '</span><span class="path-content"></span>');
      $("#full-path").html('<span class="path-label">' + Drupal.t('Full path: ') + '</span><span class="path-content"></span>');

      // Build path with parents.
      Drupal.Sweaver.buildPath(tempObject);
      Drupal.Sweaver.updateForm();
      Drupal.Sweaver.updateScreen();
    }
  }
}

/**
 * Loop through all clickable area's and bind click
 */
Drupal.Sweaver.updateScreen = function() {
  if (Drupal.settings.sweaver['preview_selector']) {
    // Add border around selected element.
    var excludes = Drupal.settings.sweaver['exclude_selectors'];
    $('.sweaver-clicked').removeClass('sweaver-clicked');
    if (Drupal.Sweaver.safeActivePath && $(Drupal.Sweaver.safeActivePath).outerWidth() != $(window).width()) {
      $(Drupal.Sweaver.safeActivePath).filter(':parents(' + excludes + '):not(' + excludes + ')').addClass('sweaver-clicked');
    }
    else {
      // Hide the 'clicked' outlines.
      $('.sweaver-clicked').removeClass('sweaver-clicked');
    }
  }
}

/**
 * Store the parents of a clicked item.
 */
Drupal.Sweaver.buildPath = function(object) {
  var index = 0;

  // Collect info on currently active item.
  Drupal.Sweaver.activeElement = Drupal.Sweaver.buildSweaverObject(object);

  // Add active element to first element in the path array.
  Drupal.Sweaver.path[0] = Drupal.Sweaver.activeElement;

  // Show the currenty active path and the full path.
  Drupal.Sweaver.addToFullPath(index, true);
  Drupal.Sweaver.addToActivePathIndex(0);

  // Traverse all parents and save them in the path array.
  var i = 1;
  var active;
  object.parents().each(function() {

    active = false;
    var parent = Drupal.Sweaver.buildSweaverObject($(this));
    if (parent.translation[0]) {
      Drupal.Sweaver.path[i] = parent;

      // If selector is tagged as 'highlight', automatically select it.
      var match = '';
      $.each(Drupal.Sweaver.selectors, function (index, selector) {
        if (selector.selector == 'sweaver_all_ids' || selector.selector == 'sweaver_all_classes' || selector.selector == 'sweaver_all_tags') {
          return false;
        }
        if (selector.selector == '#' + parent.id || selector.selector == parent.tag) {
          match = selector.selector;
          if (selector.highlight == '1') {
            active = true;
            Drupal.Sweaver.addToActivePathIndex(i);
          }
        } else {
          $.each(parent.classes, function(index, aClass) {
            if (selector.selector == '.' + aClass) {
              match = selector.selector;
              if (selector.highlight == '1') {
                active = true;
                Drupal.Sweaver.addToActivePathIndex(i);
                return false;
              }
            }
          });
        }
        if (match != '') {
         return false;
        }
      });

      // Add all items to the full path except for the html tag.
      if (parent.tag != 'html') {
        Drupal.Sweaver.addToFullPath(i, active);
      }
      i++;
    }
  });
  if (i > 2) // There are always at least 2 levels
  {
    if (!(1 in Drupal.Sweaver.pathIndexes)) {
      Drupal.Sweaver.addToActivePathIndex(1);
      $('#sweaver #full-path #sid-1').addClass('active');
    }
  }
  Drupal.Sweaver.printActivePath();
}

/**
 * Add one item to the full path.
 */
Drupal.Sweaver.addToFullPath = function(index, active) {
  var path_separator = '&nbsp;&gt;&nbsp;';
  var active_class = '';

  // Don't show a seperator after the last item in the path.
  if (index == 0) {
    path_separator = '';
  }

  // Add an active class to the selected items.
  if (active == true) {
    active_class = ' active';
  }

  // Get the list of translated selectors.
  var selectorList = Drupal.Sweaver.path[index].translation;

  // First add the default selector.
  $("#full-path .path-content").prepend('<div class="selector-wrapper' + active_class + '" id="sid-' + index + '"><div class="first-selector"><a title="' + Drupal.t('Click to add this element to the selected path') + '">' + selectorList[0] + '</a></div><div class="selector-separator">' + path_separator + '</div></div>');

  // Next add a popup with all possible selectors.
  var selectors = ''
  for (var i=1; i < selectorList.length; i++) {
    tempClass = '';
    // Add a class active to indicate the preferred selector.
    if (i == 1) {
      tempClass += 'active ';
    }
    if (i == 1) {
      tempClass += 'first ';
    }
    if (i == selectorList.length - 1) {
      tempClass += 'last';
    }
    selectors += '<li class="' + tempClass + '"><a href="#" id="ssid-' + (i-1) + '">' + selectorList[i] + '</a></li>';
  }

  // Finally, add some pseudo-classes.
  var pseudoClasses = '';
  if (Drupal.Sweaver.path[index].tag == 'a') {
    pseudoClasses += '<li class="first"><a href="#">:hover</a></li>';
    pseudoClasses += '<li><a href="#">:visited</a></li>';
    pseudoClasses += '<li><a href="#">:active</a></li>';
    pseudoClasses += '<li class="last"><a href="#" >:link</a></li>';
  }
  else {
    pseudoClasses += '<li class="first last"><a href="#" class="hover">:hover</a></li>';
  }

  $("#sid-" + index).prepend('<div class="selector-popup-opener">open</div><div class="selector-popup"><ul class="selectors">' + selectors + '</ul><ul class="pseudoclasses">' + pseudoClasses + '</ul></div>');

  // Bind click to change the active path.
  $('#sid-' + index + ' .first-selector a').click(function() {
    $(this).parent().parent().toggleClass('active');
    Drupal.Sweaver.addToActivePathIndex(index);
    Drupal.Sweaver.printActivePath();
    // Reset the active element as it might have changed.
    Drupal.Sweaver.pathIndexes.sort(function(a,b){return a - b});
    Drupal.Sweaver.activeElement = Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[0]] ? Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[0]] : {} ;
    Drupal.Sweaver.updateForm();
    Drupal.Sweaver.updateScreen();

    // Stop the link from doing anything.
    return false;
  });

  // Change the active path from a popup.
  $('#sid-' + index + ' .selector-popup ul.selectors a').click(function() {
    // Store in the active object that there is a new preferred selector instead of the first one defined in the backend.
    var $link = $(this);
    var i = $link.attr('id').substr(5);
    Drupal.Sweaver.path[index].preferredSelector = i;
    Drupal.Sweaver.printActivePath();
    // Replace the selector in the full path.
    $('#sid-' + index + ' .first-selector a').html(Drupal.Sweaver.objectToReadable(Drupal.Sweaver.path[index])[0]);
    // Add an active class.
    $link.parents('.selector-popup').css({'left' : '-10000px'}).parent().removeClass('open');
    $link.parent().siblings('.active').removeClass('active');
    $link.parent().addClass('active');
    // Update the form.
    Drupal.Sweaver.updateForm();
    Drupal.Sweaver.updateScreen();
    return false;
  });

  // Add a pseudo-class from a popup.
  $('#sid-' + index + ' .selector-popup ul.pseudoclasses a').click(function() {
    var $link = $(this);
    // If the link was already active, deactivate it otherwhise add the active class.
    if (!$link.parent().hasClass('active')) {
	    // Add the pseudo-class to the object in question.
	    Drupal.Sweaver.path[index].pseudoClass = $(this).text();
	    // Update the translation of the object in question.
	    Drupal.Sweaver.path[index].translation = Drupal.Sweaver.objectToReadable(Drupal.Sweaver.path[index]);
	    // Update the active path.
	    Drupal.Sweaver.printActivePath();
	    // Change the text in the full path.
	    $('#sid-' + index + ' .first-selector a').html(Drupal.Sweaver.path[index].translation[0]);
	    // Handle all active classes.
	    $link.parent().siblings('.active').removeClass('active');
	    $link.parent().addClass('active');
    }
    else {
      Drupal.Sweaver.path[index].pseudoClass = '';
      // Update the translation of the object in question.
      Drupal.Sweaver.path[index].translation = Drupal.Sweaver.objectToReadable(Drupal.Sweaver.path[index]);
      // Update the active path.
      Drupal.Sweaver.printActivePath();
      // Change the text in the full path.
      $('#sid-' + index + ' .first-selector a').html(Drupal.Sweaver.path[index].translation[0]);
      // Handle all active classes.
      $link.parent().removeClass('active');
	  }
    // Close the popup.
		$link.parents('.selector-popup').css({'left' : '-10000px'}).parent().removeClass('open');
    // Update the form with the new path.
    Drupal.Sweaver.updateForm();
    Drupal.Sweaver.updateScreen();
    return false;
  });

  // Hide/show selector popups.
  $('#sid-' + index + ' .selector-popup-opener').click(function() {
    var $popup = $(this).siblings('.selector-popup');
    $this = $(this);
    if ($this.parent().hasClass('open')) {
      $this.parent().removeClass('open');
      $popup.css({'left' : '-10000px'});
    }
    else {
      // Hide other open selector popups.
      $('#sweaver .selector-wrapper.open .selector-popup').css({'left' : '-10000px'});
      $this.parent().addClass('open');
      $this.parent().siblings().removeClass('open');
	    // Calculate the right width.
	    var width = 0;
	    $($popup.children('ul')).each(function() {
	     width += $(this).outerWidth();
	    });
      $popup.css({'width' : width});
      // See if the popup should be opened on the left or the right.
      var offset = $this.offset();
      var left = (offset.left + width) > $(window).width() ? - $popup.outerWidth() :  $this.outerWidth();
      $popup.hide().css({'left' : left});
      // Show the popup.
      $popup.slideDown('fast');
    }
  });
}

/**
 * Add an item to the active path index.
 * This way we can keep track of the selected items in the ful path.
 */
Drupal.Sweaver.addToActivePathIndex = function(i) {
  // Do not add the item when selected or remove it from Active path.
  var position = $.inArray(i, Drupal.Sweaver.pathIndexes);
  if (position < 0) {
    Drupal.Sweaver.pathIndexes.unshift(i);
  }
  else {
    // Remove from pathIndexes if necessary.
    for (var key in Drupal.Sweaver.pathIndexes) {
      if (Drupal.Sweaver.pathIndexes[key] == i) {
        Drupal.Sweaver.pathIndexes.splice(key, 1);
      }
    }
  }
}

/**
 * Print the active path.
 */
Drupal.Sweaver.printActivePath = function() {
  // Reset the previous path and add the next item to pathIndexes.
  $path = $("#selected-path .path-content");
  $path.html('');
  Drupal.Sweaver.activePath = '';
  // Since jquery cannot get a css value when a pseudo-class is in it, we have to create a version
  // of the active patch without the pseudo-classes.
  Drupal.Sweaver.safeActivePath = '';

  // Sort pathIndexes.
  Drupal.Sweaver.pathIndexes.sort(function(a,b){return a - b});

  // Print the selected path in human-readable language.

  if (Drupal.Sweaver.pathIndexes.length > 0) {
    for ( var i=0, len=Drupal.Sweaver.pathIndexes.length; i<len; ++i ){
      if (i > 0) {
        $path.append(' in ');
      }
      // See which translation should be used.
      var j = Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[i]].preferredSelector ? Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[i]].preferredSelector : 0;
      j++;
      $path.append(Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[i]].translation[j]);
    }
    // Save the currently active css path.
    Drupal.Sweaver.pathIndexes.reverse();
    for (var i=0, len=Drupal.Sweaver.pathIndexes.length; i<len; ++i){
      // See which translation should be used.
      var j = Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[i]].preferredSelector ? Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[i]].preferredSelector : 0;
      j++;
      Drupal.Sweaver.activePath += Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[i]].css[j] + Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[i]].pseudoClass + ' ';
      Drupal.Sweaver.safeActivePath += Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[i]].css[j] + ' ';
    }
  }
  else {
    $path.html(Drupal.t('none'));
  }
}

/**
 * Fill the activeElement and update the Form and ActivePath.
 * Other plugins can use this function to set values on the
 * style tab. To switch tabs, you can use the Drupal.Sweaver.switchTab
 * function.
 */
Drupal.Sweaver.updateStyleTab = function(theClass, name) {
  // Build the object with manipulated data.
  var tempObject = Drupal.Sweaver.buildSweaverObject($('.' + theClass));

  tempObject.translation = new Array(name, name);
  tempObject.classes = new Array('.' + theClass);
  tempObject.css = new Array('.' + theClass, '.' + theClass);

  Drupal.Sweaver.activeElement = tempObject;

  // Build path with parents.
  $('#sweaver_plugin_editor .sweaver-header').html('<div id="selected-path" class="clearfix"></div>');
  Drupal.Sweaver.path[0] = new Object({'id' : Drupal.Sweaver.activeElement.id, 'class' : Drupal.Sweaver.activeElement.classes, 'pseudoClass' : '', 'tag' : Drupal.Sweaver.activeElement.tag,  'type' : Drupal.Sweaver.activeElement.type, 'translation' : Drupal.Sweaver.activeElement.translation, 'css' : Drupal.Sweaver.activeElement.css});
  Drupal.Sweaver.addToFullPath(0, true);
  Drupal.Sweaver.pathIndexes = new Array();
  Drupal.Sweaver.addToActivePathIndex(0);
  Drupal.Sweaver.printActivePath();
  Drupal.Sweaver.activePath = '.' + theClass;
  Drupal.Sweaver.updateForm();
  Drupal.Sweaver.updateScreen();
}

/**
 * Store new value and update inline css.
 */
Drupal.Sweaver.setValue = function(property, value) {
  Drupal.Sweaver.css[Drupal.Sweaver.activePath] = Drupal.Sweaver.css[Drupal.Sweaver.activePath] || {};
  Drupal.Sweaver.css[Drupal.Sweaver.activePath][property] = {
    'value' : value,
    'hidden' : false,
  };
  Drupal.Sweaver.writeCss();
}

/**
 * Delete a property from a selector.
 */
Drupal.Sweaver.deleteProperty = function(key, property) {
  var target = Drupal.Sweaver.css[key];
  Drupal.Sweaver.css[key] = {};
  for (var prop in target) {
    if (prop != property) {
      Drupal.Sweaver.css[key][prop] = target[prop];
    }
  }
  Drupal.Sweaver.writeCss();
  Drupal.Sweaver.updateForm();
}

/**
 * Translate an parent item in a human-readable name.
 */
Drupal.Sweaver.objectToReadable = function(object) {

  var translation = new Array();
  var id_translation = new Array();
  var class_translation = new Array();
  var tag_translation = new Array();

  var css = new Array();
  var id_css = new Array();
  var class_css = new Array();
  var tag_css = new Array();

  var selector = '';
  var description = '';
  var tempSelectors = new Array();
  var pseudoClass = object.pseudoClass ? object.pseudoClass : '';

  var i = 0;

  // Traverse all selectors defined in the backend and return an array with the description.
  $.each(Drupal.Sweaver.selectors, function() {
    selector = this.selector;
    name = this.name;
    description = this.description;

    if (name == 'allids') {
      if (object.id && $.inArray('#' + object.id, tempSelectors) < 0) {
        id_translation[i] = 'the ' + object.id + ' region';
        id_css[i] = '#' + object.id;
        tempSelectors.push('#' + object.id);
        i++;
      }
    }
    else if (name == 'allclasses') {
      if (object.classes && object.classes[0]) {
        $.each(object.classes, function(index, tempClass) {
          if ($.inArray(tempClass, Drupal.Sweaver.excludeClasses) < 0 && $.inArray('.' + tempClass, tempSelectors) < 0) {
            class_translation[i] = 'all ' + tempClass;
            class_css[i] = '.' + tempClass;
            tempSelectors.push('.' + tempClass);
            i++;
          }
        });
      }
    }
    else if (name == 'alltags' && $.inArray(object.tag, tempSelectors) < 0) {
      tag_translation[i] = object.tag;
      tag_css[i] = object.tag;
      tempSelectors.push(object.tag);
      i++;
    }
    else {
      if (selector == '#' + object.id && $.inArray('#' + object.id, tempSelectors) < 0) {
        id_translation[i] = description;
        id_css[i] = '#' + object.id;
        tempSelectors.push('#' + object.id);
        i++;
      } else if (selector == object.tag && $.inArray(object.tag, tempSelectors) < 0) {
        tag_translation[i] = description;
        tag_css[i] = object.tag;
        tempSelectors.push(object.tag);
        i++;
      } else {
        $.each(object.classes, function(index, tempClass) {
          if (selector == '.' + tempClass  && $.inArray(tempClass, Drupal.Sweaver.excludeClasses) < 0 && $.inArray('.' + tempClass, tempSelectors) < 0) {
            class_translation[i] = description;
            class_css[i] = '.' + tempClass;
            tempSelectors.push('.' + tempClass);
            i++;
          }
        });
      }
    }
  });

  // Merge the translation arrays.
  for (var j = 0; j < i; j++) {
    var k = id_translation[j] ? id_translation[j] : class_translation[j] ? class_translation[j] : tag_translation[j];
    translation[j] = Drupal.Sweaver.addPseudoClass(pseudoClass, k);
  }

  // Merge the css arrays.
  for (var j = 0; j < i; j++) {
    var k = id_css[j] ? id_css[j] : class_css[j] ? class_css[j] : tag_css[j];
    css[j] = k;
  }

  // Add combinations of classes, ids and tags.
  if (Drupal.settings.sweaver['combined_selectors']) {
	  t = i;
	  if (tag_translation.length > 0) {
	    $.each(tag_translation, function(index, tag) {
	      if (tag) {
			    $.each(id_translation, function(index, trans) {
			      if (trans) {
			        translation[t] = Drupal.Sweaver.addPseudoClass(pseudoClass, tag + ' + ' + trans);
			        css[t] = object.tag + id_css[index];
			        t++;
			      }
			    });
		      $.each(class_translation, function(index, trans) {
		        if (trans) {
		          translation[t] = Drupal.Sweaver.addPseudoClass(pseudoClass, tag + ' + ' + trans);
              css[t] = object.tag + class_css[index];
		          t++;
		        }
		      });
		    }
		  });
	  }
  }

  // If a prefered selector was set in the object, return that one instead of the default first one.
  index = object.preferredSelector ? object.preferredSelector : 0;
  translation.splice(0, 0, translation[index]);
  css.splice(0, 0, css[index]);

  object.translation = Drupal.settings.sweaver['translate_path'] ? translation : css;
  object.css = css;
  return translation;
}

/**
 * Add a pseudo class to the translation.
 */
Drupal.Sweaver.addPseudoClass = function(pseudoClass, original) {
  if (Drupal.settings.sweaver['translate_path']) {
    var translation = pseudoClass ? original + Drupal.t(' in the ' + pseudoClass + ' state') : original;
  }
  else {
    var translation = pseudoClass ? original + pseudoClass : original;
  }
  return translation;
}

/**
 * Save current position
 */
Drupal.Sweaver.SavePosition = function() {
  // Store the object used
  // First we need to construct this path
  path = '';
  Drupal.Sweaver.path.reverse();
  $.each(Drupal.Sweaver.path, function(index, value){
    $.each(value.classes, function(i, v){
      if (v == 'sweaver-hovered' || v == 'sweaver-clicked') {
        value.classes.splice(i);
      }
    })
    
    if (value.tag == 'html' || value.tag == 'body') {
      path += ' ' + value.tag;
    }
    else if (value.id != '') {
      path += ' #' + value.id;
    }
    else if (Object.keys( value.classes ).length !== 0 && value.classes[0] != ''){
      path += ' .' + value.classes[0];
    }
    else {
      path += ' ' + value.tag;
    }
  });
  Drupal.Sweaver.path.reverse();
  Drupal.Sweaver.cookie('sweaver_active_path', path);
  
  // Save indexed path
  indexed_path = '';
  $('#sweaver_plugin_editor #full-path div[id^=sid-].active').each(function(){
    id = $(this).attr('id').substr(4);
    $(this).find('li.active').each(function(){
      if ($(this).children().attr('id') != '') {
        sub_id = $(this).children().attr('id').substr(5);
      }
      else {
        sub_id = $(this).children().attr('class');
      }
      indexed_path += ' ' + id + '-' + sub_id;
    });
  });
  Drupal.Sweaver.cookie('sweaver_indexed_path', indexed_path);
  
  // Store the tab used
  Drupal.Sweaver.cookie('sweaver_active_vertical_tab', $('#sweaver_plugin_editor #sweaver-editor .vertical-tabs a.active').parent().attr('id'));
}

/**
 * Load a saved position in the editor (active path and tab)
 */
Drupal.Sweaver.LoadPosition = function() {
  active_path = Drupal.Sweaver.cookie('sweaver_active_path');
  indexed_path = Drupal.Sweaver.cookie('sweaver_indexed_path');
  vertical_tab = Drupal.Sweaver.cookie('sweaver_active_vertical_tab');
  
  // If a configuration has been saved lets load it
  if (active_path && indexed_path && vertical_tab){    
    tempObject = $(active_path);
    
    // Load active path in the editor
    Drupal.Sweaver.editSelection(tempObject);
    
    // Reset full path
    $('#sweaver_plugin_editor #full-path div[id^=sid-]').removeClass('active');
    Drupal.Sweaver.pathIndexes = [];
    
    // Apply indexed path
    $.each(indexed_path.split(' '), function(index, value){
      specific_path = value.split('-');
      if (specific_path.length == 2) {
        $('#sweaver_plugin_editor #full-path #sid-' + specific_path[0]).addClass('active');
        Drupal.Sweaver.addToActivePathIndex(specific_path[0]);
        Drupal.Sweaver.pathIndexes.sort(function(a,b){return a - b});
        
        if (specific_path[1].match('^[0-9]+$')) {
        // Alternative Class  
          Drupal.Sweaver.path[specific_path[0]].preferredSelector = specific_path[1];
          
          $('#sid-' + specific_path[0] + ' .first-selector a').html(Drupal.Sweaver.objectToReadable(Drupal.Sweaver.path[specific_path[0]])[0]);
          
          $('#sweaver_plugin_editor #full-path #sid-' + specific_path[0] + ' .selectors li').removeClass('active');
          $('#sweaver_plugin_editor #full-path #sid-' + specific_path[0] + ' #ssid-' + specific_path[1]).parent().addClass('active');
        }
        else {
        // Pseudo Class
          Drupal.Sweaver.path[specific_path[0]].pseudoClass = ':' + specific_path[1];
          Drupal.Sweaver.path[specific_path[0]].translation = Drupal.Sweaver.objectToReadable(Drupal.Sweaver.path[specific_path[0]]);
          $('#sid-' + specific_path[0] + ' .first-selector a').html(Drupal.Sweaver.path[specific_path[0]].translation[0]);
          
          $('#sweaver_plugin_editor #full-path #sid-' + specific_path[0] + ' .pseudoclasses .' + specific_path[1]).parent().addClass('active');
        }
      }
    });
    Drupal.Sweaver.printActivePath();
    Drupal.Sweaver.activeElement = Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[0]] ? Drupal.Sweaver.path[Drupal.Sweaver.pathIndexes[0]] : {} ;
    Drupal.Sweaver.updateForm();
    Drupal.Sweaver.updateScreen();
    
    $('#sweaver_plugin_editor #sweaver-editor #' + vertical_tab + ' a').click();
    
    Drupal.Sweaver.cookie('sweaver_active_path', null);
    Drupal.Sweaver.cookie('sweaver_indexed_path', null);
    Drupal.Sweaver.cookie('sweaver_active_vertical_tab', null);
  }
}


/**
 * Build a Sweaver object.
 */
Drupal.Sweaver.buildSweaverObject = function(object) {
  var tempObject = new Object;
  tempObject.id = object.attr('id');
  tempObject.classes = trim(object.attr('class')).split(' ');
  tempObject.pseudoClass = '';
  tempObject.tag = object.get(0).tagName.toLowerCase();
  tempObject.type = object.css('display');

  // Fallback to block if an unknow type is detected.
  if (!(tempObject.type in Drupal.Sweaver.types)) {
    tempObject.type = 'block';
  }

  // Generate a human-readable name and a css selector.
  Drupal.Sweaver.objectToReadable(tempObject);
  return tempObject;
}

/**
 * Helper function to remove trailing leading and multiple spaces.
 */
function trim(s) {
  s = s.replace(/(^\s*)|(\s*$)/gi,"");
  s = s.replace(/[ ]{2,}/gi," ");
  s = s.replace(/\n /,"\n");
  return s;
}

/**
 * Hide all sliders.
 */
Drupal.Sweaver.hideOverlays = function() {
  $('#sweaver .slider-wrapper').css({'visibility' : 'hidden'});

  // Remove all active classes from form-items and groups
  $('#sweaver_plugin_editor .form-item, #sweaver_plugin_editor .sweaver-group').removeClass('active');
}

/**
 * Check wether the editor tab is visible.
 */
Drupal.Sweaver.visible = function() {
  if (Drupal.Sweaver.open == 'true' && $('#sweaver_plugin_editor .sweaver-content').is(':visible')) {
    return true;
  }
  else {
    return false;
  }
}

/**
 * Helper function to check if an object is empty.
 */
function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop))
      return false;
  }
  return true;
}


/**
 * Add custom expression to exclude all selectors in the sweaver bar.
 */
$.expr[':'].parents = function(a,i,m){
  return jQuery(a).parents(m[3]).length < 1;
};

})(jQuery);;
/*
 * jQuery JSON Plugin
 * version: 2.1 (2009-08-14)
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Brantley Harris wrote this plugin. It is based somewhat on the JSON.org 
 * website's http://www.json.org/json2.js, which proclaims:
 * "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
 * I uphold.
 *
 * It is also influenced heavily by MochiKit's serializeJSON, which is 
 * copyrighted 2005 by Bob Ippolito.
 */
 
(function($) {
    /** jQuery.toJSON( json-serializble )
        Converts the given argument into a JSON respresentation.

        If an object has a "toJSON" function, that will be used to get the representation.
        Non-integer/string keys are skipped in the object, as are keys that point to a function.

        json-serializble:
            The *thing* to be converted.
     **/
    $.toJSON = function(o)
    {
        if (typeof(JSON) == 'object' && JSON.stringify)
            return JSON.stringify(o);
        
        var type = typeof(o);
    
        if (o === null)
            return "null";
    
        if (type == "undefined")
            return undefined;
        
        if (type == "number" || type == "boolean")
            return o + "";
    
        if (type == "string")
            return $.quoteString(o);
    
        if (type == 'object')
        {
            if (typeof o.toJSON == "function") 
                return $.toJSON( o.toJSON() );
            
            if (o.constructor === Date)
            {
                var month = o.getUTCMonth() + 1;
                if (month < 10) month = '0' + month;

                var day = o.getUTCDate();
                if (day < 10) day = '0' + day;

                var year = o.getUTCFullYear();
                
                var hours = o.getUTCHours();
                if (hours < 10) hours = '0' + hours;
                
                var minutes = o.getUTCMinutes();
                if (minutes < 10) minutes = '0' + minutes;
                
                var seconds = o.getUTCSeconds();
                if (seconds < 10) seconds = '0' + seconds;
                
                var milli = o.getUTCMilliseconds();
                if (milli < 100) milli = '0' + milli;
                if (milli < 10) milli = '0' + milli;

                return '"' + year + '-' + month + '-' + day + 'T' +
                             hours + ':' + minutes + ':' + seconds + 
                             '.' + milli + 'Z"'; 
            }

            if (o.constructor === Array) 
            {
                var ret = [];
                for (var i = 0; i < o.length; i++)
                    ret.push( $.toJSON(o[i]) || "null" );

                return "[" + ret.join(",") + "]";
            }
        
            var pairs = [];
            for (var k in o) {
                var name;
                var type = typeof k;

                if (type == "number")
                    name = '"' + k + '"';
                else if (type == "string")
                    name = $.quoteString(k);
                else
                    continue;  //skip non-string or number keys
            
                if (typeof o[k] == "function") 
                    continue;  //skip pairs where the value is a function.
            
                var val = $.toJSON(o[k]);
            
                pairs.push(name + ":" + val);
            }

            return "{" + pairs.join(", ") + "}";
        }
    };

    /** jQuery.evalJSON(src)
        Evaluates a given piece of json source.
     **/
    $.evalJSON = function(src)
    {
        if (typeof(JSON) == 'object' && JSON.parse)
            return JSON.parse(src);
        return eval("(" + src + ")");
    };
    
    /** jQuery.secureEvalJSON(src)
        Evals JSON in a way that is *more* secure.
    **/
    $.secureEvalJSON = function(src)
    {
        if (typeof(JSON) == 'object' && JSON.parse)
            return JSON.parse(src);
        
        var filtered = src;
        filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@');
        filtered = filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        
        if (/^[\],:{}\s]*$/.test(filtered))
            return eval("(" + src + ")");
        else
            throw new SyntaxError("Error parsing JSON, source is not valid.");
    };

    /** jQuery.quoteString(string)
        Returns a string-repr of a string, escaping quotes intelligently.  
        Mostly a support function for toJSON.
    
        Examples:
            >>> jQuery.quoteString("apple")
            "apple"
        
            >>> jQuery.quoteString('"Where are we going?", she asked.')
            "\"Where are we going?\", she asked."
     **/
    $.quoteString = function(string)
    {
        if (string.match(_escapeable))
        {
            return '"' + string.replace(_escapeable, function (a) 
            {
                var c = _meta[a];
                if (typeof c === 'string') return c;
                c = a.charCodeAt();
                return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) + '"';
        }
        return '"' + string + '"';
    };
    
    var _escapeable = /["\\\x00-\x1f\x7f-\x9f]/g;
    
    var _meta = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    };
})(jQuery);
;
/**
 *
 * Color picker
 * Author: Stefan Petre www.eyecon.ro
 *
 * Dual licensed under the MIT and GPL licenses
 *
 */
(function ($) {
	var ColorPicker = function () {
		var
			ids = {},
			inAction,
			charMin = 65,
			visible,
			tpl = '<div class="colorpicker"><div class="colorpicker_color"><div><div></div></div></div><div class="colorpicker_hue"><div></div></div><div class="colorpicker_new_color"></div><div class="colorpicker_current_color"></div><div class="colorpicker_hex"><input type="text" maxlength="6" size="6" /></div><div class="colorpicker_rgb_r colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_rgb_g colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_rgb_b colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_h colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_s colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_b colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_transparent"><a href="" title="Make transparent" alt="Make transparent">Transparent</a></div><div class="colorpicker_submit"></div><div class="colorpicker_previous_colors"></div></div>',
			defaults = {
				eventName: 'click',
				onShow: function () {},
				onBeforeShow: function(){},
				onHide: function () {},
				onChange: function () {},
				onSubmit: function () {},
				color: 'ff0000',
				livePreview: true,
				flat: false
			},
			fillRGBFields = function  (hsb, cal) {
				var rgb = HSBToRGB(hsb);
				$(cal).data('colorpicker').fields
					.eq(1).val(rgb.r).end()
					.eq(2).val(rgb.g).end()
					.eq(3).val(rgb.b).end();
			},
			fillHSBFields = function  (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(4).val(hsb.h).end()
					.eq(5).val(hsb.s).end()
					.eq(6).val(hsb.b).end();
			},
			fillHexFields = function (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(0).val(HSBToHex(hsb)).end();
			},
			setSelector = function (hsb, cal) {
				$(cal).data('colorpicker').selector.css('backgroundColor', '#' + HSBToHex({h: hsb.h, s: 100, b: 100}));
				$(cal).data('colorpicker').selectorIndic.css({
					left: parseInt(150 * hsb.s/100, 10),
					top: parseInt(150 * (100-hsb.b)/100, 10)
				});
			},
			setHue = function (hsb, cal) {
				$(cal).data('colorpicker').hue.css('top', parseInt(150 - 150 * hsb.h/360, 10));
			},
			setCurrentColor = function (hsb, cal) {
				$(cal).data('colorpicker').currentColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			setNewColor = function (hsb, cal) {
				$(cal).data('colorpicker').newColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			keyDown = function (ev) {
				var pressedKey = ev.charCode || ev.keyCode || -1;
				if ((pressedKey > charMin && pressedKey <= 90) || pressedKey == 32) {
					return false;
				}
				var cal = $(this).parent().parent();
				if (cal.data('colorpicker').livePreview === true) {
					change.apply(this);
				}
			},
			change = function (ev) {
				var cal = $(this).parent().parent(), col;
				if (this.parentNode.className.indexOf('_hex') > 0) {
					cal.data('colorpicker').color = col = HexToHSB(fixHex(this.value));
				} else if (this.parentNode.className.indexOf('_hsb') > 0) {
					cal.data('colorpicker').color = col = fixHSB({
						h: parseInt(cal.data('colorpicker').fields.eq(4).val(), 10),
						s: parseInt(cal.data('colorpicker').fields.eq(5).val(), 10),
						b: parseInt(cal.data('colorpicker').fields.eq(6).val(), 10)
					});
				} else {
					cal.data('colorpicker').color = col = RGBToHSB(fixRGB({
						r: parseInt(cal.data('colorpicker').fields.eq(1).val(), 10),
						g: parseInt(cal.data('colorpicker').fields.eq(2).val(), 10),
						b: parseInt(cal.data('colorpicker').fields.eq(3).val(), 10)
					}));
				}
				if (ev) {
					fillRGBFields(col, cal.get(0));
					fillHexFields(col, cal.get(0));
					fillHSBFields(col, cal.get(0));
				}
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
				cal.data('colorpicker').onChange.apply(cal, [col, HSBToHex(col), HSBToRGB(col)]);
			},
			blur = function (ev) {
				var cal = $(this).parent().parent();
				cal.data('colorpicker').fields.parent().removeClass('colorpicker_focus');
			},
			focus = function () {
				charMin = this.parentNode.className.indexOf('_hex') > 0 ? 70 : 65;
				$(this).parent().parent().data('colorpicker').fields.parent().removeClass('colorpicker_focus');
				$(this).parent().addClass('colorpicker_focus');
			},
			downIncrement = function (ev) {
				var field = $(this).parent().find('input').focus();
				var current = {
					el: $(this).parent().addClass('colorpicker_slider'),
					max: this.parentNode.className.indexOf('_hsb_h') > 0 ? 360 : (this.parentNode.className.indexOf('_hsb') > 0 ? 100 : 255),
					y: ev.pageY,
					field: field,
					val: parseInt(field.val(), 10),
					preview: $(this).parent().parent().data('colorpicker').livePreview
				};
				$(document).bind('mouseup', current, upIncrement);
				$(document).bind('mousemove', current, moveIncrement);
			},
			moveIncrement = function (ev) {
				ev.data.field.val(Math.max(0, Math.min(ev.data.max, parseInt(ev.data.val + ev.pageY - ev.data.y, 10))));
				if (ev.data.preview) {
					change.apply(ev.data.field.get(0), [true]);
				}
				return false;
			},
			upIncrement = function (ev) {
				change.apply(ev.data.field.get(0), [true]);
				ev.data.el.removeClass('colorpicker_slider').find('input').focus();
				$(document).unbind('mouseup', upIncrement);
				$(document).unbind('mousemove', moveIncrement);
				return false;
			},
			downHue = function (ev) {
				var current = {
					cal: $(this).parent(),
					y: $(this).offset().top
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upHue);
				$(document).bind('mousemove', current, moveHue);
        sweaver_add_colors(ev);
        return false;
			},
			moveHue = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(4)
						.val(parseInt(360*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.y))))/150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			upHue = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upHue);
				$(document).unbind('mousemove', moveHue);
        sweaver_add_colors(ev);
				return false;
			},
			downSelector = function (ev) {
				var current = {
					cal: $(this).parent(),
					pos: $(this).offset()
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upSelector);
				$(document).bind('mousemove', current, moveSelector);
			},

      // ************************
      // Sweaver additions
      // ************************

			// Do selection also when clicking.
			clickSelector = function (ev) {
				var current = {
					cal: $(this).parent(),
					pos: $(this).offset()
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				ev.data = {};
				ev.data.cal = current.cal;
				ev.data.pos = current.pos;
				moveSelector(ev);
			},

			// Add a transparent option as background-color.
			makeTransparent = function(ev) {
				var cal = $(this).parent().parent(), col;
				cal.data('colorpicker').onChange.apply(cal, ['transparent', 'transparent', 'transparent']);
				return false;
			},

      // Select previous color.
      selectPreviousColor = function(ev) {

        // Create new color.
        var new_color = {};
        color = $(this).css('background-color').replace('rgb(', '').replace(')', '').split(',');
        new_color.r = color[0];
        new_color.g = color[1];
        new_color.b = color[2];
        new_color = fixRGB(new_color);
        new_color = RGBToHSB(new_color);
        new_color = fixHSB(new_color);

        var cal = $(this).parent().parent(), col;

        // Set the new color.
        fillRGBFields(new_color, cal);
        fillHexFields(new_color, cal);
        fillHSBFields(new_color, cal);
        setSelector(new_color, cal);
        setHue(new_color, cal);
        setNewColor(new_color, cal);
        cal.data('colorpicker').onChange.apply(cal, [new_color, HSBToHex(new_color), HSBToRGB(new_color)]);

        // Update pallet.
        sweaver_add_colors(ev);
      },

      // Add previous colors.
      sweaver_add_colors = function (ev) {
        colors = '';
        var new_color = '';
        previous_colors = new Array;

        for (var key in Drupal.Sweaver.css) {
          var target = Drupal.Sweaver.css[key];
          for (var prop in target) {
            if (Drupal.Sweaver.properties[prop]) {
              var properties = Drupal.Sweaver.properties[prop]['property'].split(' ');
              $.each(properties, function(i, property) {
                // Don't add a prefix and suffix for these exceptions.
                if ((property == 'background-color' || property == 'color') && target[prop] != 'transparent' && $.inArray(target[prop], previous_colors) < 0) {
                  previous_colors.push(target[prop]);
                  colors += '<div class="colorpicker_previous_colors_color" style="background-color: #'+ target[prop] +';"></div>';
                }
              });
            }
          }
        }

        var cal = $(this).parent().parent(), col;

        $('.colorpicker_previous_colors').html(colors);
        // Bind on colorpicker_previous_colors_color.
        $('.colorpicker_previous_colors_color').bind('click', selectPreviousColor);
      },

      // ************************
      // End of sweaver additions
      // ************************

			moveSelector = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(6)
						.val(parseInt(100*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.pos.top))))/150, 10))
						.end()
						.eq(5)
						.val(parseInt(100*(Math.max(0,Math.min(150,(ev.pageX - ev.data.pos.left))))/150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			upSelector = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upSelector);
				$(document).unbind('mousemove', moveSelector);
        sweaver_add_colors(ev);
				return false;
			},
			enterSubmit = function (ev) {
				$(this).addClass('colorpicker_focus');
			},
			leaveSubmit = function (ev) {
				$(this).removeClass('colorpicker_focus');
			},
			clickSubmit = function (ev) {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').color;
				cal.data('colorpicker').origColor = col;
				setCurrentColor(col, cal.get(0));
				cal.data('colorpicker').onSubmit(col, HSBToHex(col), HSBToRGB(col), cal.data('colorpicker').el);
			},
			show = function (ev) {
				var cal = $('#' + $(this).data('colorpickerId'));
				cal.data('colorpicker').onBeforeShow.apply(this, [cal.get(0)]);
				var pos = $(this).offset();
				var viewPort = getViewport();
				var top = pos.top + this.offsetHeight;
				var left = pos.left;
				if (top + 176 > viewPort.t + viewPort.h) {
					top -= this.offsetHeight + 176;
				}
				if (left + 356 > viewPort.l + viewPort.w) {
					left -= 356;
				}
				cal.css({left: left + 'px', top: top + 'px'});
				if (cal.data('colorpicker').onShow.apply(this, [cal.get(0)]) != false) {
					cal.show();
				}
				$(document).bind('mousedown', {cal: cal}, hide);
        sweaver_add_colors(ev);
				return false;
			},
			hide = function (ev) {
				if (!isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
					if (ev.data.cal.data('colorpicker').onHide.apply(this, [ev.data.cal.get(0)]) != false) {
						ev.data.cal.hide();
					}
					$(document).unbind('mousedown', hide);
				}
			},
			isChildOf = function(parentEl, el, container) {
				if (parentEl == el) {
					return true;
				}
				if (parentEl.contains) {
					return parentEl.contains(el);
				}
				if ( parentEl.compareDocumentPosition ) {
					return !!(parentEl.compareDocumentPosition(el) & 16);
				}
				var prEl = el.parentNode;
				while(prEl && prEl != container) {
					if (prEl == parentEl)
						return true;
					prEl = prEl.parentNode;
				}
				return false;
			},
			getViewport = function () {
				var m = document.compatMode == 'CSS1Compat';
				return {
					l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
					t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
					w : window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
					h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
				};
			},
			fixHSB = function (hsb) {
				return {
					h: Math.min(360, Math.max(0, hsb.h)),
					s: Math.min(100, Math.max(0, hsb.s)),
					b: Math.min(100, Math.max(0, hsb.b))
				};
			},
			fixRGB = function (rgb) {
				return {
					r: Math.min(255, Math.max(0, rgb.r)),
					g: Math.min(255, Math.max(0, rgb.g)),
					b: Math.min(255, Math.max(0, rgb.b))
				};
			},
			fixHex = function (hex) {
				var len = 6 - hex.length;
				if (len > 0) {
					var o = [];
					for (var i=0; i<len; i++) {
						o.push('0');
					}
					o.push(hex);
					hex = o.join('');
				}
				return hex;
			},
			HexToRGB = function (hex) {
				var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
				return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
			},
			HexToHSB = function (hex) {
				return RGBToHSB(HexToRGB(hex));
			},
			RGBToHSB = function (rgb) {
				var hsb = {
					h: 0,
					s: 0,
					b: 0
				};
				var min = Math.min(rgb.r, rgb.g, rgb.b);
				var max = Math.max(rgb.r, rgb.g, rgb.b);
				var delta = max - min;
				hsb.b = max;
				if (max != 0) {

				}
				hsb.s = max != 0 ? 255 * delta / max : 0;
				if (hsb.s != 0) {
					if (rgb.r == max) {
						hsb.h = (rgb.g - rgb.b) / delta;
					} else if (rgb.g == max) {
						hsb.h = 2 + (rgb.b - rgb.r) / delta;
					} else {
						hsb.h = 4 + (rgb.r - rgb.g) / delta;
					}
				} else {
					hsb.h = -1;
				}
				hsb.h *= 60;
				if (hsb.h < 0) {
					hsb.h += 360;
				}
				hsb.s *= 100/255;
				hsb.b *= 100/255;

        // Sweaver : round to avoid minor differences when re-selecting colors.
        hsb.h = Math.round(hsb.h);
        hsb.s = Math.round(hsb.s);
        hsb.b = Math.round(hsb.b);

				return hsb;
			},
			HSBToRGB = function (hsb) {
				var rgb = {};
				var h = Math.round(hsb.h);
				var s = Math.round(hsb.s*255/100);
				var v = Math.round(hsb.b*255/100);
				if(s == 0) {
					rgb.r = rgb.g = rgb.b = v;
				} else {
					var t1 = v;
					var t2 = (255-s)*v/255;
					var t3 = (t1-t2)*(h%60)/60;
					if(h==360) h = 0;
					if(h<60) {rgb.r=t1;	rgb.b=t2; rgb.g=t2+t3}
					else if(h<120) {rgb.g=t1; rgb.b=t2;	rgb.r=t1-t3}
					else if(h<180) {rgb.g=t1; rgb.r=t2;	rgb.b=t2+t3}
					else if(h<240) {rgb.b=t1; rgb.r=t2;	rgb.g=t1-t3}
					else if(h<300) {rgb.b=t1; rgb.g=t2;	rgb.r=t2+t3}
					else if(h<360) {rgb.r=t1; rgb.g=t2;	rgb.b=t1-t3}
					else {rgb.r=0; rgb.g=0;	rgb.b=0}
				}
				return {r:Math.round(rgb.r), g:Math.round(rgb.g), b:Math.round(rgb.b)};
			},
			RGBToHex = function (rgb) {
				var hex = [
					rgb.r.toString(16),
					rgb.g.toString(16),
					rgb.b.toString(16)
				];
				$.each(hex, function (nr, val) {
					if (val.length == 1) {
						hex[nr] = '0' + val;
					}
				});
				return hex.join('');
			},
			HSBToHex = function (hsb) {
				return RGBToHex(HSBToRGB(hsb));
			},
			restoreOriginal = function () {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').origColor;
				cal.data('colorpicker').color = col;
				fillRGBFields(col, cal.get(0));
				fillHexFields(col, cal.get(0));
				fillHSBFields(col, cal.get(0));
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
			};
		return {
			init: function (opt) {
				opt = $.extend({}, defaults, opt||{});
				if (typeof opt.color == 'string') {
					opt.color = HexToHSB(opt.color);
				} else if (opt.color.r != undefined && opt.color.g != undefined && opt.color.b != undefined) {
					opt.color = RGBToHSB(opt.color);
				} else if (opt.color.h != undefined && opt.color.s != undefined && opt.color.b != undefined) {
					opt.color = fixHSB(opt.color);
				} else {
					return this;
				}
				return this.each(function () {
					if (!$(this).data('colorpickerId')) {
						var options = $.extend({}, opt);
						options.origColor = opt.color;
						var id = 'collorpicker_' + parseInt(Math.random() * 1000);
						$(this).data('colorpickerId', id);
						var cal = $(tpl).attr('id', id);
						if (options.flat) {
							cal.appendTo(this).show();
						} else {
							cal.appendTo(document.body);
						}
						options.fields = cal
											.find('input')
												.bind('keyup', keyDown)
												.bind('change', change)
												.bind('blur', blur)
												.bind('focus', focus);
						cal
							.find('span').bind('mousedown', downIncrement).end()
							.find('>div.colorpicker_current_color').bind('click', restoreOriginal);
						// Also add clickselector on click.
						options.selector = cal.find('div.colorpicker_color').bind('mousedown', downSelector).bind('click', clickSelector);
						options.selectorIndic = options.selector.find('div div');
						options.el = this;
						options.hue = cal.find('div.colorpicker_hue div');
						cal.find('div.colorpicker_hue').bind('mousedown', downHue);
						options.newColor = cal.find('div.colorpicker_new_color');
						options.currentColor = cal.find('div.colorpicker_current_color');
						cal.data('colorpicker', options);
						cal.find('div.colorpicker_submit')
							.bind('mouseenter', enterSubmit)
							.bind('mouseleave', leaveSubmit)
							.bind('click', clickSubmit);
						// Transparent.
						cal.find('div.colorpicker_transparent a').bind('click', makeTransparent);
						fillRGBFields(options.color, cal.get(0));
						fillHSBFields(options.color, cal.get(0));
						fillHexFields(options.color, cal.get(0));
						setHue(options.color, cal.get(0));
						setSelector(options.color, cal.get(0));
						setCurrentColor(options.color, cal.get(0));
						setNewColor(options.color, cal.get(0));
						if (options.flat) {
							cal.css({
								position: 'relative',
								display: 'block'
							});
						} else {
							$(this).bind(options.eventName, show);
						}
					}
				});
			},
			showPicker: function() {
				return this.each( function () {
					if ($(this).data('colorpickerId')) {
						show.apply(this);
					}
				});
			},
			hidePicker: function() {
				return this.each( function () {
					if ($(this).data('colorpickerId')) {
						$('#' + $(this).data('colorpickerId')).hide();
					}
				});
			},
			setColor: function(col) {
				if (typeof col == 'string') {
					col = HexToHSB(col);
				} else if (col.r != undefined && col.g != undefined && col.b != undefined) {
					col = RGBToHSB(col);
				} else if (col.h != undefined && col.s != undefined && col.b != undefined) {
					col = fixHSB(col);
				} else {
					return this;
				}
				return this.each(function(){
					if ($(this).data('colorpickerId')) {
						var cal = $('#' + $(this).data('colorpickerId'));
						cal.data('colorpicker').color = col;
						cal.data('colorpicker').origColor = col;
						fillRGBFields(col, cal.get(0));
						fillHSBFields(col, cal.get(0));
						fillHexFields(col, cal.get(0));
						setHue(col, cal.get(0));
						setSelector(col, cal.get(0));
						setCurrentColor(col, cal.get(0));
						setNewColor(col, cal.get(0));
					}
				});
			}
		};
	}();
	$.fn.extend({
		ColorPicker: ColorPicker.init,
		ColorPickerHide: ColorPicker.hidePicker,
		ColorPickerShow: ColorPicker.showPicker,
		ColorPickerSetColor: ColorPicker.setColor
	});
})(jQuery);
/* $Id: sweaver_plugin_styles.js,v 1.1.4.5 2010/11/05 23:54:07 swentel Exp $ */

/**
 * @file
 * Styles javascript.
 */

(function ($) {

/**
 * Start autosave poller.
 */
$(document).ready(function() {
  var span = 0;
  if (Drupal.settings.sweaver['autosave'] != undefined) {
	var interval = Drupal.settings.sweaver['autosave'];
    if (parseInt(interval) > 0) {
      var interval = (interval * 1000) + span;
      var autosave = setInterval('Drupal.Sweaver.AutoSave()', interval);
      span += 100;
    }
  }
});

/**
 * Autosave function.
 */
Drupal.Sweaver.AutoSave = function(context) {
  if (Drupal.Sweaver.changed) {
    Drupal.Sweaver.changed = false;
	  
    // Get values for css, customcss & palette (if available)
    var css = $('[name=sweaver-css]').val();
    if ($('#edit-sweaver-plugin-custom-css').length) {
      var customcss = $('#edit-sweaver-plugin-custom-css').val();      
    }
    else {
      var customcss = '';            
    }
    if ($('[name=sweaver-plugin-palette]').length) {
      var palette = $('[name=sweaver-plugin-palette]').val();
    }
    else {
      var palette = '';
    }

    $.ajax({
      type: "POST",
      url: Drupal.settings.basePath + 'index.php?q=sweaver-autosave',
      data: {
        css: css,
        customcss: customcss,
        palette: palette        
      },
      dataType: 'json',
      timeout: 5000,
      success: function(data){
        if (typeof data['message'] == 'undefined' || data['message'] != 0) {
          Drupal.Sweaver.setMessage(Drupal.t('Your changes have been saved.'), 2000);
        }
        if (typeof data['error'] == 'undefined' || data['error'] != 0) {
          Drupal.Sweaver.setMessage(Drupal.t('Your changes have been saved.'), 2000);
        }
      },
      error: function() {
        Drupal.Sweaver.setMessage(Drupal.t('There was an error saving current changes!'), 2000);
      }
    });
    return false;
  }	  
}

/**
 * Behaviors for style actions.
 */
Drupal.behaviors.StylesActions = {
  attach: function(context) {
    $("#style-actions-data-1 select.radio-style-save-type").change(function() {
      var radio_style_save_type = $("#style-actions-data-1 select.radio-style-save-type option:selected").val();
      if (radio_style_save_type == 1) {
        $('#edit-save-style').hide();
        $('#edit-style-existing-id').show();
      }
      else {
        $('#edit-save-style').show();
        $('#edit-style-existing-id').hide();
      }
    });

    $("#sweaver-popup #edit-delete-confirm").click(function() {
      $('#sweaver-popup .delete-style-confirm').hide();
      $('#sweaver-popup .delete-style-question').show();
      return false;
    });

    $("#sweaver-popup #edit-delete-cancel").click(function() {
      $('#sweaver-popup .delete-style-confirm').show();
      $('#sweaver-popup .delete-style-question').hide();
      return false;
    });
  }
};

})(jQuery);;
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

})(jQuery);;

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

})(jQuery);;

/**
 * Sweaver WatchDog
 * Plugin used to list all modification made in the editor
 * Each modification can be hidden or deleted then
 * A hidden property is not displayed but is still saved so that the user can, at any moment, activate it
 */

(function ($) {
    
Drupal.Sweaver = Drupal.Sweaver || {};

/**
 * Hook onload behavior
 */
$(document).ready(function() {  
  Drupal.Sweaver.writeModifications();
  
  $('#tab-sweaver_plugin_advanced').click(function(){
    Drupal.Sweaver.writeModifications();
  });

});

/**
 * A simple function to update the screen after a modification
 */
Drupal.Sweaver.reloadInterface = function() {
  Drupal.Sweaver.writeCss();
  Drupal.Sweaver.updateForm();
  Drupal.Sweaver.writeModifications();
}

/**
 * Write all modifications made in the plugin's tab
 */
Drupal.Sweaver.writeModifications = function() {
  var data = ''; // Contains all data that will be form the #scrollable_area
  var key_id = 0; // Get an ID for the key
  var properties_counted = 0; // Count all properties modified
  var hidden_properties_counted = 0; // Count all properties modified that are hidden
  
  data += '<table>';
  for (key in Drupal.Sweaver.css) {
    key_id++;
    var target = Drupal.Sweaver.css[key];
    var temp_data = '';
    var sub_properties_counted = 0;
    var sub_hidden_properties_counted = 0;
    
    for (prop in target) {
      properties_counted++;
      sub_properties_counted++;
      
      if (Drupal.Sweaver.properties[prop] && (target[prop]['value'] != '' || target[prop]['value'] == '0')) {        
        if (target[prop]['hidden'] == true){
          temp_data += '<tr class="hidden" onclick="Drupal.Sweaver.showKey(' + key_id +')">';
        }
        else {
          temp_data += '<tr onclick="Drupal.Sweaver.showKey(' + key_id +')">';
        }
        
        // Special case for transparent.
        if ((prop == 'background-color' && target[prop]['value'] == 'transparent') || (prop == 'background-image' && target[prop]['value'] == 'none')) {
          temp_data += '<td class="property">' + prop + ' : ' + target[prop]['value'] + '</td>';
        }
        else {
          temp_data += '<td class="property">' + prop + ' : ' + Drupal.Sweaver.properties[prop].prefix + target[prop]['value'] + Drupal.Sweaver.properties[prop].suffix + '</td>';
        }
        
        if (target[prop]['hidden'] == true){
          var hide_class = 'disabled';
          var show_class = '';
          hidden_properties_counted++;
          sub_hidden_properties_counted++;
        }
        else {
          var hide_class = '';
          var show_class = 'disabled';
        }
        
        temp_data += '<td class="operations">';        
        temp_data += '<span class="delete" onclick="Drupal.Sweaver.deleteProperty(\'' + key + '\', \'' + prop + '\'); Drupal.Sweaver.writeModifications();">' + 'Delete' + '</span>';
        temp_data += '<span class="hide ' + hide_class + '" onclick="Drupal.Sweaver.propertyHider(\'' + key + '\', \'' + prop + '\');">Hide</span>';
        temp_data += '<span class="show ' + show_class + '" onclick="Drupal.Sweaver.propertyHider(\'' + key + '\', \'' + prop + '\');">Show</span>';
        temp_data += '</td></tr>';
      }
    }
    
    if (sub_properties_counted == sub_hidden_properties_counted) {
      var hide_class = 'disabled';
      var show_class = '';
    }
    else if (sub_hidden_properties_counted == 0) {
      var hide_class = '';
      var show_class = 'disabled';
    }
    else {
      var hide_class = '';
      var show_class = '';
    }
    
    data += '<tr class="separator" onclick="Drupal.Sweaver.showKey(' + key_id +')"><th>' + key + '</th><td class="operations">';
    data += '<span class="title delete" onclick="Drupal.Sweaver.deleteKeyProperties(\'' + key + '\');">Delete</span>';
    data += '<span class="title hide ' + hide_class + '" onclick="Drupal.Sweaver.keyPropertiesHider(\'' + key + '\', true);">Hide</span>';
    data += '<span class="title show ' + show_class + '" onclick="Drupal.Sweaver.keyPropertiesHider(\'' + key + '\', false);">Show</span>';
    data += '</td></tr>';
    data += temp_data;
  }
  data += '</table>';
  $('#watchdog #scrollable_area').html(data);
  
  if (properties_counted == hidden_properties_counted) {
    $('#watchdog .header .operations .hide').addClass('disabled');
    $('#watchdog .header .operations .show').removeClass('disabled');
  }
  else if (hidden_properties_counted == 0) {
    $('#watchdog .header .operations .hide').removeClass('disabled');
    $('#watchdog .header .operations .show').addClass('disabled');
  }
  else {
    $('#watchdog .header .operations .hide').removeClass('disabled');
    $('#watchdog .header .operations .show').removeClass('disabled');
  }
}

/**
 * Select a container from a key_id
 * This container is selected on the screen (class sweaver-clicked)
 */
Drupal.Sweaver.showKey = function (key_id) {
  var counter = 0;
  for (key in Drupal.Sweaver.css) {
    counter++;
    if (counter ==  key_id) {
      $('.sweaver-clicked').removeClass('sweaver-clicked');
      $(key).addClass('sweaver-clicked');
    }
  }
  $('#watchdog tr').removeClass('active');
  $('#watchdog tr[onclick=Drupal.Sweaver.showKey(' + key_id + ')]').addClass('active');
}

/**
 * Delete all properties modified with the editor that are applied to a specified container (key)
 */
Drupal.Sweaver.deleteKeyProperties = function(key) {
  delete Drupal.Sweaver.css[key];
  
  Drupal.Sweaver.reloadInterface();
}

/**
 * Delete all properties modified with the editor
 */
Drupal.Sweaver.deleteAllProperties = function() {
  Drupal.Sweaver.css = new Object();
  
  Drupal.Sweaver.reloadInterface();
}

/**
 * Hide one property
 * key (string) the container
 * property (string) the property to hide
 */
Drupal.Sweaver.propertyHider = function(key, property) {
  var target = Drupal.Sweaver.css[key];
  for (prop in target) {
    if (prop == property) {
      Drupal.Sweaver.css[key][property]['hidden'] = !Drupal.Sweaver.css[key][property]['hidden'];
      
      Drupal.Sweaver.reloadInterface();
    }
  }
}

/**
 * Hide or Show (dependent on the value of hide) all properties that are in a specified container (key)
 */
Drupal.Sweaver.keyPropertiesHider = function(key, hide) {
  var target = Drupal.Sweaver.css[key];
  for (prop in target) {
    Drupal.Sweaver.css[key][prop]['hidden'] = hide;
  }
  
  Drupal.Sweaver.reloadInterface();
}

/**
 * Hide all properties made in the editor
 */
Drupal.Sweaver.cssHider = function(hide) {
  for (key in Drupal.Sweaver.css) {
    var target = Drupal.Sweaver.css[key];
    for (prop in target) {
      Drupal.Sweaver.css[key][prop]['hidden'] = hide;
    }
  }
  Drupal.Sweaver.reloadInterface();
}

})(jQuery);;
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

})(jQuery);;
/*
 * jQuery Hotkeys Plugin
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based upon the plugin by Tzury Bar Yochay:
 * http://github.com/tzuryby/hotkeys
 *
 * Original idea by:
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
*/

(function(jQuery){

  jQuery.hotkeys = {
    version: "0.8",

    specialKeys: {
      8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
      20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
      37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
      96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
      104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
      112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
      120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
    },

    shiftNums: {
      "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
      "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
      ".": ">",  "/": "?",  "\\": "|"
    }
  };

  function keyHandler( handleObj ) {
    // Only care when a possible input has been specified
    if ( typeof handleObj.data !== "string" ) {
      return;
    }

    var origHandler = handleObj.handler,
      keys = handleObj.data.toLowerCase().split(" ");

    handleObj.handler = function( event ) {
      // Don't fire in text-accepting inputs that we didn't directly bind to
      if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
         event.target.type === "text") ) {
        return;
      }

      // Keypress represents characters, not special keys
      var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
        character = String.fromCharCode( event.which ).toLowerCase(),
        key, modif = "", possible = {};

      // check combinations (alt|ctrl|shift+anything)
      if ( event.altKey && special !== "alt" ) {
        modif += "alt+";
      }

      if ( event.ctrlKey && special !== "ctrl" ) {
        modif += "ctrl+";
      }

      // TODO: Need to make sure this works consistently across platforms
      if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
        modif += "meta+";
      }

      if ( event.shiftKey && special !== "shift" ) {
        modif += "shift+";
      }

      if ( special ) {
        possible[ modif + special ] = true;

      } else {
        possible[ modif + character ] = true;
        possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

        // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
        if ( modif === "shift+" ) {
          possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
        }
      }

      for ( var i = 0, l = keys.length; i < l; i++ ) {
        if ( possible[ keys[i] ] ) {
          return origHandler.apply( this, arguments );
        }
      }
    };
  }

  jQuery.each([ "keydown", "keyup", "keypress" ], function() {
    jQuery.event.special[ this ] = { add: keyHandler };
  });

})( jQuery );;
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
;
(function ($) {

$(document).ready(function() {

  // Expression to check for absolute internal links.
  var isInternal = new RegExp("^(https?):\/\/" + window.location.host, "i");

  // Attach onclick event to document only and catch clicks on all elements.
  $(document.body).click(function(event) {
    // Catch the closest surrounding link of a clicked element.
    $(event.target).closest("a,area").each(function() {

      var ga = Drupal.settings.googleanalytics;
      // Expression to check for special links like gotwo.module /go/* links.
      var isInternalSpecial = new RegExp("(\/go\/.*)$", "i");
      // Expression to check for download links.
      var isDownload = new RegExp("\\.(" + ga.trackDownloadExtensions + ")$", "i");

      // Is the clicked URL internal?
      if (isInternal.test(this.href)) {
        // Skip 'click' tracking, if custom tracking events are bound.
        if ($(this).is('.colorbox')) {
          // Do nothing here. The custom event will handle all tracking.
        }
        // Is download tracking activated and the file extension configured for download tracking?
        else if (ga.trackDownload && isDownload.test(this.href)) {
          // Download link clicked.
          var extension = isDownload.exec(this.href);
          _gaq.push(["_trackEvent", "Downloads", extension[1].toUpperCase(), this.href.replace(isInternal, '')]);
        }
        else if (isInternalSpecial.test(this.href)) {
          // Keep the internal URL for Google Analytics website overlay intact.
          _gaq.push(["_trackPageview", this.href.replace(isInternal, '')]);
        }
      }
      else {
        if (ga.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
          // Mailto link clicked.
          _gaq.push(["_trackEvent", "Mails", "Click", this.href.substring(7)]);
        }
        else if (ga.trackOutbound && this.href.match(/^\w+:\/\//i)) {
          if (ga.trackDomainMode == 2 && isCrossDomain(this.hostname, ga.trackCrossDomains)) {
            // Top-level cross domain clicked. document.location is handled by _link internally.
            event.preventDefault();
            _gaq.push(["_link", this.href]);
          }
          else {
            // External link clicked.
            _gaq.push(["_trackEvent", "Outbound links", "Click", this.href]);
          }
        }
      }
    });
  });

  // Colorbox: This event triggers when the transition has completed and the
  // newly loaded content has been revealed.
  $(document).bind("cbox_complete", function() {
    var href = $.colorbox.element().attr("href");
    if (href) {
      _gaq.push(["_trackPageview", href.replace(isInternal, '')]);
    }
  });

});

/**
 * Check whether the hostname is part of the cross domains or not.
 *
 * @param string hostname
 *   The hostname of the clicked URL.
 * @param array crossDomains
 *   All cross domain hostnames as JS array.
 *
 * @return boolean
 */
function isCrossDomain(hostname, crossDomains) {
  /**
   * jQuery < 1.6.3 bug: $.inArray crushes IE6 and Chrome if second argument is
   * `null` or `undefined`, http://bugs.jquery.com/ticket/10076,
   * https://github.com/jquery/jquery/commit/a839af034db2bd934e4d4fa6758a3fed8de74174
   *
   * @todo: Remove/Refactor in D8
   */
  if (!crossDomains) {
    return false;
  }
  else {
    return $.inArray(hostname, crossDomains) > -1 ? true : false;
  }
}

})(jQuery);
;
