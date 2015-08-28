/*
  @file
  Defines the simple modal behavior
*/
(function ($) {
  Drupal.behaviors.validates = {
    attach: function(context, settings) {
      var nodeType = Drupal.settings.event_popup.content_type;
      nodeType = nodeType.replace('_', '-');
      var formId = '#' + nodeType + '-node-form #edit-submit';
      $( formId ).click(function () {
      if ($("#display_error").length == 0) {
      $('#event-calendar-node-form').prepend('<div class="messages error" id = "display_error"><h2 class="element-invisible">Error message</h2><ul id="cl"  style="margin-left: 51px;"></ul></div>');
		   }
		  var eventTitle = $( '#edit-title'), 
		  startDate = $( '#edit-event-calendar-date-und-0-value-datepicker-popup-0' ),
		  endDate = $( '#edit-event-calendar-date-und-0-value2-datepicker-popup-0' ), 
		  showEndDate = $( '#edit-event-calendar-date-und-0-show-todate'),
		  allFields = $( [] ).add( eventTitle ).add( startDate ).add( endDate ),
		  tips = $( '#cl' );
		  var bValid = true;
		  allFields.removeClass( "ui-state-error" );
		  bValid = bValid && checkLength( eventTitle, "Event title", 1 );
                  bValid = bValid && checkStartDateLength( startDate, "Date", 1 );
                  if(showEndDate.attr('checked')) { 
                    bValid = bValid && checkEndDateLength( endDate, "Date", 1 );
		    bValid = bValid && DateCompare( startDate, endDate );
		  }
			if(!bValid) {
			  return false;
			}

      function updateTips( t ) {
	      tips
        .html( '<li>' + t + '</li>' )
        .addClass( "ui-state-highlight" );
        setTimeout(function() {
          tips.removeClass( "ui-state-highlight", 1500 );
        }, 500 );
      }
      function checkLength( o, n, min ) {
        if ( o.val().length < 1 ) {
          o.addClass( "ui-state-error" );
          updateTips( "Please enter event title");
            return false;
        } else {
          return true;
        }
      }

     function checkStartDateLength( o, n, min ) {
        if ( o.val().length < 1 ) {
          o.addClass( "ui-state-error" );
          updateTips( "Please enter start date");
            return false;
        } else {
          return true;
        }
      }
      
     function checkEndDateLength( o, n, min ) {
        if ( o.val().length < 1 ) {
          o.addClass( "ui-state-error" );
          updateTips( "Please enter end date");
            return false;
        } else {
          return true;
        }
      }
     
     function DateCompare(startDate, endDate) {
        var str1 = startDate.val();
        var str2 = endDate.val();
        if (str1.trim() != '' && str2.trim() != '') {
          var yr1 = parseInt(str1.substring(6, 10), 10);
          var dt1 = parseInt(str1.substring(3, 5), 10);
          var mon1 = parseInt(str1.substring(0, 2), 10);
          var yr2 = parseInt(str2.substring(6, 10), 10);
          var dt2 = parseInt(str2.substring(3, 5), 10);
          var mon2 = parseInt(str2.substring(0, 2), 10);
          var startDate1 = new Date(yr1, mon1, dt1);
          var endDate1 = new Date(yr2, mon2, dt2);
          if (startDate1 > endDate1) {
            startDate.addClass( "ui-state-error" );
            endDate.addClass( "ui-state-error" );
            updateTips( "Please enter valid date");
            return false;
        }
      }
        return true;
      }
	  });
    }
  };

})(jQuery);
