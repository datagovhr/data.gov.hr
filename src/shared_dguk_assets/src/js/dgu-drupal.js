jQuery(function() {
  window.$ = jQuery;

  $.each($('article.node-app .field-name-field-screen-shots'), useFancyboxForScreenshots);
});


/* Drupal dumps giant images into the page, we turn them into nice screenshots */
function useFancyboxForScreenshots(i,screenshotContainer) {
  screenshotContainer = $(screenshotContainer);
  screenshotContainer.hide();

  var drupal_screenshots = $.map( screenshotContainer.find('img'), function(x,i) { return $(x).attr('src'); });
  if (drupal_screenshots.length==0) { return; }

  // Create fancyBox container
  $('<div class="fancybox"/>').insertBefore(screenshotContainer);
  var f = $('.fancybox');

  // Generate screenshot thumbnails
  $.each(drupal_screenshots, function(i,x) { 
    var html = ('\
      <a class="screenshot thumbnail" rel="group" href="'+x+'">\
        <img src="'+x+'" alt="" />\
      </a>\
    '); 
    $(html).appendTo(f); 
  })
  // Clearfix floating screenshots
  $('<div class="clearfix"/>').appendTo(f);

  // Apply jQuery library
  $('.fancybox .screenshot').fancybox()
};


/* 
 * New plugin: Equal height boxes.
 * When the window container is resized, all elements in group are made equal height.
 */
$(function() {
  var w = $(window);
  var page = $('.page');
  groups = [ 
    $('.pane-latest-datasets,.pane-latest-blogs-and-forums'),
  ];
  $.each(groups, function(i,group) {
    if (group.length==0) { return; }
    var cachedWidth = -1;
    function resizeChildren() {
      var newWidth = page.width();
      if (newWidth==cachedWidth) { return; }
      cachedWidth = newWidth;
      group.height('auto');
      // Affect only browser windows
      if (w.width()>=768) {
        var maxHeight = 0; 
        group.each(function(i,x){ maxHeight=Math.max(maxHeight,$(x).height())});
        group.height(maxHeight);
      }
    }
    w.resize( resizeChildren );
    resizeChildren();
  });
});
