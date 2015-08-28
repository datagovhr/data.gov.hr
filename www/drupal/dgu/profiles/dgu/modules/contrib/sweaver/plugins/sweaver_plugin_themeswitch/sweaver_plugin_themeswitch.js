/* $Id: sweaver_plugin_themeswitch.js,v 1.1.4.4 2010/11/08 15:07:58 swentel Exp $ */

/**
 * Add scroller on the theme switcher.
 * Inspiration from http://jqueryui.com/demos/slider/side-scroll.html
 */

Drupal.Sweaver = Drupal.Sweaver || {};

$(document).ready(function() {
  Drupal.Sweaver.themeSwitch_init();
  $('#tab-sweaver_plugin_themeswitch a').click(function() {
    Drupal.Sweaver.themeSwitch_init();
  });
});


Drupal.Sweaver.themeSwitch_init = function() {
    // Set content width
    var width = 0;
    $('#themeswitch-content .selected-image').each(function () {
      width += $(this).outerWidth(true);
    });
    $('#themeswitch-content').css('width', width +'px');

    // scrollpane parts
    var scrollPane = $('#themeswitch-pane');
    var scrollContent = $('#themeswitch-content');

    // build slider
    var scrollbar = $("#sweaver .scroll-bar").slider({
      slide:function(e, ui){
        if (scrollContent.width() > scrollPane.width()) {
          //scrollContent.css('margin-left', Math.round( ui.value / 100 * ( scrollPane.width() - scrollContent.width() )) + 'px');
          scrollContent.css('cssText', 'margin-left: ' + Math.round( ui.value / 100 * ( scrollPane.width() - scrollContent.width() )) + 'px !important; width: ' + width + 'px');
        }
        else {
          //scrollContent.css('margin-left', 0);
          scrollContent.css('cssText', 'margin-left: 0px !important; width: ' + width + 'px');
        }
      }
    });

    // append icon to handle.
    var handleHelper = scrollbar.find('.ui-slider-handle')
    .mousedown(function(){
      scrollbar.width( handleHelper.width() );
    })
    .mouseup(function(){
      scrollbar.width( '100%' );
    })
    .append('<span class="ui-icon ui-icon-grip-dotted-vertical"></span>')
    .wrap('<div class="ui-handle-helper-parent"></div>').parent();

    // change overflow to hidden now that slider handles the scrolling.
    scrollPane.css('overflow','hidden');

    // size scrollbar and handle proportionally to scroll distance.
    function sizeScrollbar(){
      if (scrollContent.width() > scrollPane.width()) {
        handleHelper.parents('.ui-slider').show();
        var remainder = scrollContent.width() - scrollPane.width();
        var proportion = remainder / scrollContent.width();
        var handleSize = scrollPane.width() - (proportion * scrollPane.width());
        scrollbar.find('.ui-slider-handle').css({
          width: handleSize
        });
        handleHelper.width(scrollbar.width());
      }
      else {
        handleHelper.parents('.ui-slider').hide();
      }
    }

    // reset slider value based on scroll content position
    function resetValue(){
      var remainder = scrollPane.width() - scrollContent.width();
      var leftVal = scrollContent.css('margin-left') == 'auto' ? 0 : parseInt(scrollContent.css('margin-left'));
      var percentage = Math.round(leftVal / remainder * 100);
      scrollbar.slider("value", percentage);
    }

    // change handle position on window resize
    $(window)
    .resize(function(){
      if (scrollPane.parent().is(':visible')) {
        resetValue();
        sizeScrollbar();
      }
    });

    // init scrollbar size
    setTimeout(sizeScrollbar,10); // safari wants a timeout
};