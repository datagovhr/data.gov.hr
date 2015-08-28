/*
  @file
  Defines the simple modal behavior
*/
(function ($) {
  Drupal.behaviors.event_popup = {
    attach: function(context, settings) {
	  
	    if ($("#event-popup-container").length == 0) {
        // Add a container to the end of the body tag to hold the dialog
        $('body').append('<div id="event-popup-container" style="display:none;"></div>');
        try {
          // Attempt to invoke the simple dialog
          $( "#event-popup-container").dialog({
            autoOpen: false,
            modal: true,
            close: function(event, ui) {
              // Clear the dialog on close. Not necessary for your average use
              // case, butis useful if you had a video that was playing in the
              // dialog so that it clears when it closes
              $('#event-popup-container').html('');
            }
          });
          var defaultOptions = Drupal.event_popup.explodeOptions(settings.event_popup.defaults);
          $('#event-popup-container').dialog('option', defaultOptions);
        }
        catch (err) {
          // Catch any errors and report
          Drupal.event_popup.log('[error] Event Dialog: ' + err);
        }
	    }
	    // Add support for custom classes if necessary
      var classes = '';
      if (settings.event_popup.classes) {
        classes = ', .' + settings.event_popup.classes;
      }
	    $('a.event-popup' + classes, context).each(function(event) {
        if (!event.metaKey && !$(this).hasClass('simpleEventProcessed')) {
          // Add a class to show that this link has been processed already
          $(this).addClass('simpleEventProcessed');
          $(this).click(function(event) {
            // prevent the navigation
            event.preventDefault();
            // Set up some variables
            var url = $(this).attr('href');
            var title = $(this).attr('title');
            // Use defaults if not provided
             var selector = 'node-event-calendar';
            
            var options =  Drupal.event_popup.explodeOptions('width:auto;height:auto;position:[300,140]');
           
            if (url && title && selector) {
              // Set the custom options of the dialog
              $('#event-popup-container').dialog('option', options);
              
              // Set the title of the dialog
              $('#event-popup-container').dialog('option', 'title', title);
              
              // Add a little loader into the dialog while data is loaded
              $('#event-popup-container').html('<div class="event-popup-ajax-loader"></div>');
              
              // Change the height if it's set to auto
              if (options.height && options.height == 'auto') {
                $('#event-popup-container').dialog('option', 'height', 200);
              }
             
              // Use jQuery .get() to request the target page
              $.get(url, function(data) {
                // Re-apply the height if it's auto to accomodate the new content
                if (options.height && options.height == 'auto') {
					 
                  $('#event-popup-container').dialog('option', 'height', options.height);
                  
                }
                // Some trickery to make sure any inline javascript gets run.
                // Inline javascript gets removed/moved around when passed into
                // $() so you have to create a fake div and add the raw data into
                // it then find what you need and clone it. Fun.
                 $('#event-popup-container').html( $( '<div></div>' ).html( data ).find( '.' + selector ).clone() );
                
                // Attach any behaviors to the loaded content
                //Drupal.attachBehaviors($('#event-popup-container'));
                
              });
              // Open the dialog
              $('#event-popup-container').dialog('open');
              // Return false for good measure
              return false;
            }
          });
        }
      });
	    var op = Drupal.settings.event_popup.op;
      if(op) {
        $('table.full tr td, table.mini tr td', context).click(function () {
	    //$('.fc-sun', context).click(function () {
			  var node_type = Drupal.settings.event_popup.content_type;
        node_type = node_type.replace('_', '-');
        var url = Drupal.settings.basePath + 'node/add/' +  node_type;
        var title =  'Create Event';
        // Use defaults if not provided
        var selector = Drupal.settings.event_popup.selector;
        //var options =  Drupal.event_popup.explodeOptions(settings.event_popup.defaults);
        var options =  Drupal.event_popup.explodeOptions('width:auto;height:auto;position:[300,140]');
        if (url && title && selector) {
			    var event_date = $(this).attr('data-date');
			    /* var event_date_sep = event_date.split('-');
			    var year = event_date_sep[0];
			    var month = event_date_sep[1];
			    var day = event_date_sep[2]; */
				  // Set the custom options of the dialog
          $('#event-popup-container').dialog('option', options);
          // Set the title of the dialog
          $('#event-popup-container').dialog('option', 'title', title);
          // Add a little loader into the dialog while data is loaded
          $('#event-popup-container').html('<div class="event-popup-ajax-loader"></div>');
          // Change the height if it's set to auto
          if (options.height && options.height == 'auto') {
            $('#event-popup-container').dialog('option', 'height', 200);
          }
          // Use jQuery .get() to request the target page
				
				$.get(url, {'date':event_date}, function(data) {
					
					 // Re-apply the height if it's auto to accomodate the new content
                if (options.height && options.height == 'auto') {
                  $('#event-popup-container').dialog('option', 'height', options.height);
                }
                // Some trickery to make sure any inline javascript gets run.
                // Inline javascript gets removed/moved around when passed into
                // $() so you have to create a fake div and add the raw data into
                // it then find what you need and clone it. Fun.
                $('#event-popup-container').html( $( '<div></div>' ).html( data ).find( '#' + selector ).clone() );
                // Attach any behaviors to the loaded content
                //Drupal.attachBehaviors($('#event-popup-container'));	 
				});
				 // Open the dialog
              $('#event-popup-container').dialog('open');
              // Return false for good measure
              return false;
			}
      });
      }
    }
		  
  };


// Create a namespace for our simple dialog module
  Drupal.event_popup = {};

  // Convert the options to an object
  Drupal.event_popup.explodeOptions = function (opts) {
    var options = opts.split(';');
    var explodedOptions = {};
    for (var i in options) {
      if (options[i]) {
        // Parse and Clean the option
        var option = Drupal.event_popup.cleanOption(options[i].split(':'));
        explodedOptions[option[0]] = option[1];
      }
    }
    return explodedOptions;
  }

  // Function to clean up the option.
  Drupal.event_popup.cleanOption = function(option) {
    // If it's a position option, we may need to parse an array
    if (option[0] == 'position' && option[1].match(/\[.*,.*\]/)) {
      option[1] = option[1].match(/\[(.*)\]/)[1].split(',');
      // Check if positions need be converted to int
      if (!isNaN(parseInt(option[1][0]))) {
        option[1][0] = parseInt(option[1][0]);
      }
      if (!isNaN(parseInt(option[1][1]))) {
        option[1][1] = parseInt(option[1][1]);
      }
    }
    // Convert text boolean representation to boolean
    if (option[1] === 'true') {
      option[1]= true;
    }
    else if (option[1] === 'false') {
      option[1] = false;
    }
    return option;
  }

  Drupal.event_popup.log = function(msg) {
    if (window.console) {
      window.console.log(msg);
    }

  }
  
})(jQuery);
