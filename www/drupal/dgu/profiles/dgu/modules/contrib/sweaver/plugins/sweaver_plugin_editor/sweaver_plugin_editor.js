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

})(jQuery);