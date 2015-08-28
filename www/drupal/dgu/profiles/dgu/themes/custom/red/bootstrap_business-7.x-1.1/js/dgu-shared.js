$(function() {
  initNav();
  comments();
});

function initNav() {
  var triggers = $('.trigger-subnav');
  var chevron = $('.chevron');
  var greenbar = $('#greenbar');
  window.navOpen = false;
  $('body').addClass('navClosed');
  triggers.click(function(e) {
    var target = $(e.delegateTarget);
    var subnav, chevronClass, propagateEvent;
    if (target.hasClass('nav-home')) {
      subnav = $();
      chevronClass = 'position1';
      propagateEvent = true;
    }
    else if (target.hasClass('nav-data')) {
      subnav = $('.subnav-data');
      chevronClass = 'position2';
    }
    else if (target.hasClass('nav-apps')) {
      subnav = $();
      chevronClass = 'position3';
      propagateEvent = true;
    }
    else if (target.hasClass('nav-interact')) {
      subnav = $('.subnav-interact');
      //subnav = $();
      chevronClass = 'position4';
    }
    else {
      throw 'Unrecognised subnav trigger',target;
    }
    var greenbar = $('#greenbar');
    //--  The navOpen behaviour is only visible on mobile.
    if (chevron.hasClass(chevronClass)) {
      window.navOpen = !window.navOpen;
    } 
    else {
      window.navOpen = true
    }
    // --
    var old_height = greenbar.height();
    $('body').toggleClass('navOpen',window.navOpen);
    $('body').toggleClass('navClosed',!window.navOpen);
    // Update subnav
    $('.subnav').removeClass('active');
    subnav.addClass('active');
    var new_height = greenbar.outerHeight();
    greenbar.height(old_height);
    greenbar.stop().animate({height:new_height},300,'swing',function() { greenbar.css('height','auto'); });
    // Update chevron
    chevron.attr('class','chevron '+chevronClass);

    // Finally, work out if event should be propagated
    // back to the browser
    if (!propagateEvent) {
      e.preventDefault();
      // This isn't necessary but is someone else's code
      return false;
    }
  });
}

function comments() {
    $('.replies-header').each(function(index) {
        var comment_type = $(this).text();
        $(this).prepend('<a class="comments-collapse expanded pull-right" href="#">Collapse all ' + comment_type.toLowerCase() + ' <i class="icon-collapse-top"></i></a>');
    });

    $('.comments-collapse').click(function(){
        $(this).toggleClass('expanded');
        if ($(this).hasClass('expanded')) {
            $(this).parent().parent().find('.reply-body').show();
            $(this).parent().parent().find('.reply').removeClass('collapsed');
            $(this).parent().parent().find('.comment-collapse').addClass('expanded');
            $(this).parent().parent().find('.comment-collapse').html('<i class="icon-collapse-top"></i>');
            //$(this).html('Collapse all comments <i class="icon-collapse-top"></i>' + $(this).html());
            $(this).html($(this).html().replace('Expand', 'Collapse'));
            $(this).children('i').removeClass('icon-expand');
            $(this).children('i').addClass('icon-collapse-top');
        }
        else {
            $(this).parent().parent().find('.reply-body').hide();
            $(this).parent().parent().find('.reply').addClass('collapsed');
            $(this).parent().parent().find('.comment-collapse').removeClass('expanded');
            $(this).parent().parent().find('.comment-collapse').html('<i class="icon-expand"></i>');
            //$(this).html('Expand all comments <i class="icon-expand"></i>' + $(this).html() );
            $(this).html($(this).html().replace('Collapse', 'Expand'));
            $(this).children('i').removeClass('icon-collapse-top');
            $(this).children('i').addClass('icon-expand');
        }
        return false;
    });

    $('body:not(.page-reply) .reply .inner').prepend('<a title="Collapse this comment" class="comment-collapse expanded" href="#"><i class="icon-collapse-top"></i></a>');
    $('.comment-collapse').click(function(){
        $(this).toggleClass('expanded');
        $(this).parent().parent().toggleClass('collapsed');
        if ($(this).hasClass('expanded')) {
            $(this).parent().find('.reply-body').show();
            $(this).html('<i class="icon-collapse-top"></i>');
            $(this).prop('title', 'Collapse this comment');
        }
        else {
            $(this).parent().find('.reply-body').hide();
            $(this).html('<i class="icon-expand"></i>');
            $(this).prop('title', 'Expand this comment');
        }
        return false;
    });

    $('body:not(.page-reply) .reply:not(.parent-0)').prepend('<a title="See start of thread" class="go-to-parent" href="#"><i class="icon-circle-arrow-up"></i></a>');
    $('.go-to-parent').click(function(){
        var parent = $(this).parent().attr("class").match(/parent-(\d*)/)[1];
        $('html, body').animate({'scrollTop' : $('#reply-' + parent).offset().top - 50},800, 'swing', function(){
            $('#reply-' + parent).fadeOut(100);
            $('#reply-' + parent).fadeIn(200);
        });
        return false;
    });
}
/*
 * New plugin: Equal height boxes.
 * When the parent container is resized (eg. browser resizes,
 * hitting a breakpoint) each "foo" is set to equal height.
 * eg.
 * <div class="dgu-equal-height" data-selector="foo">
 *   <div class="foo"> ... </div>
 *   <div class="foo"> ... </div>
 * </div>
 */
$(function() {
  var w = $(window);
  $('.dgu-equal-height').each(function(i,target) {
    target = $(target);
    var selector = target.attr('data-selector');
    var children = target.find(selector);
    var cachedWidth = -1;
    function resizeChildren() {
      var newWidth = target.width();
      if (newWidth==cachedWidth) { return; }
      cachedWidth = newWidth;
      children.height('auto');
      // Affect only browser windows
      if (w.width()>=992) {
	var maxHeight = 0;
        children.each(function(i,x){ maxHeight=Math.max(maxHeight,$(x).height())});
        children.height(maxHeight);
      }
    }
    if (children.length>1) {
      w.resize( resizeChildren );
      resizeChildren();
    }
  });
});

/* 
 * New plugin: Hashtab
 */
$(function() {
  var hashtabs = $('a[data-hash]');
  if (hashtabs.length==0) { return; }
  var wHash = (window.location.hash || '#').substring(1);
  var initially_open = hashtabs.filter('[data-hash="'+wHash+'"]');
  if (initially_open.length == 1) {
    $(initially_open).tab('show');
  }
  hashtabs.on('shown.bs.tab',function(e) {
    var target = $(e.delegateTarget);
    window.location.hash = target.attr('data-hash');
  });
});
