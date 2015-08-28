(function ($) {

/**
 * Attach handlers to evaluate the strength of any password fields and to check
 * that its confirmation is correct.
 */
Drupal.behaviors.password = {
  attach: function (context, settings) {
    var translate = settings.password;
    $('input.password-field', context).once('password', function () {
      var passwordInput = $(this);
      var innerWrapper = $(this).parent();
      var outerWrapper = $(this).parent().parent();

      // Add identifying class to password element parent.
      innerWrapper.addClass('password-parent');

      // Add the password confirmation layer.
      $('input.password-confirm', outerWrapper).parent().prepend('<div class="password-confirm">' + translate['confirmTitle'] + ' <span></span></div>').addClass('confirm-parent');
      var confirmInput = $('input.password-confirm', outerWrapper);
      var confirmResult = $('div.password-confirm', outerWrapper);
      var confirmChild = $('span', confirmResult);

      // Add the description box.
      var passwordMeter = '<div class="password-strength"><div class="password-strength-text" aria-live="assertive"></div><div class="password-strength-title">' + translate['strengthTitle'] + '</div><div class="password-indicator"><div class="indicator"></div></div></div>';
      $(confirmInput).parent().after('<div class="password-suggestions description"></div>');
      $(innerWrapper).prepend(passwordMeter);
      var passwordDescription = $('div.password-suggestions', outerWrapper).hide();

      // Check the password strength.
      var passwordCheck = function () {

        // Evaluate the password strength.
        var result = Drupal.evaluatePasswordStrength(passwordInput.val(), settings.password);

        // Update the suggestions for how to improve the password.
        if (passwordDescription.html() != result.message) {
          passwordDescription.html(result.message);
        }

        // Only show the description box if there is a weakness in the password.
        if (result.strength == 100) {
          passwordDescription.hide();
        }
        else {
          passwordDescription.show();
        }

        // Adjust the length of the strength indicator.
        $(innerWrapper).find('.indicator').css('width', result.strength + '%');

        // Update the strength indication text.
        $(innerWrapper).find('.password-strength-text').html(result.indicatorText);

        passwordCheckMatch();
      };

      // Check that password and confirmation inputs match.
      var passwordCheckMatch = function () {

        if (confirmInput.val()) {
          var success = passwordInput.val() === confirmInput.val();

          // Show the confirm result.
          confirmResult.css({ visibility: 'visible' });

          // Remove the previous styling if any exists.
          if (this.confirmClass) {
            confirmChild.removeClass(this.confirmClass);
          }

          // Fill in the success message and set the class accordingly.
          var confirmClass = success ? 'ok' : 'error';
          confirmChild.html(translate['confirm' + (success ? 'Success' : 'Failure')]).addClass(confirmClass);
          this.confirmClass = confirmClass;
        }
        else {
          confirmResult.css({ visibility: 'hidden' });
        }
      };

      // Monitor keyup and blur events.
      // Blur must be used because a mouse paste does not trigger keyup.
      passwordInput.keyup(passwordCheck).focus(passwordCheck).blur(passwordCheck);
      confirmInput.keyup(passwordCheckMatch).blur(passwordCheckMatch);
    });
  }
};

/**
 * Evaluate the strength of a user's password.
 *
 * Returns the estimated strength and the relevant output message.
 */
Drupal.evaluatePasswordStrength = function (password, translate) {
  var weaknesses = 0, strength = 100, msg = [];

  var hasLowercase = /[a-z]+/.test(password);
  var hasUppercase = /[A-Z]+/.test(password);
  var hasNumbers = /[0-9]+/.test(password);
  var hasPunctuation = /[^a-zA-Z0-9]+/.test(password);

  // If there is a username edit box on the page, compare password to that, otherwise
  // use value from the database.
  var usernameBox = $('input.username');
  var username = (usernameBox.length > 0) ? usernameBox.val() : translate.username;

  // Lose 5 points for every character less than 6, plus a 30 point penalty.
  if (password.length < 6) {
    msg.push(translate.tooShort);
    strength -= ((6 - password.length) * 5) + 30;
  }

  // Count weaknesses.
  if (!hasLowercase) {
    msg.push(translate.addLowerCase);
    weaknesses++;
  }
  if (!hasUppercase) {
    msg.push(translate.addUpperCase);
    weaknesses++;
  }
  if (!hasNumbers) {
    msg.push(translate.addNumbers);
    weaknesses++;
  }
  if (!hasPunctuation) {
    msg.push(translate.addPunctuation);
    weaknesses++;
  }

  // Apply penalty for each weakness (balanced against length penalty).
  switch (weaknesses) {
    case 1:
      strength -= 12.5;
      break;

    case 2:
      strength -= 25;
      break;

    case 3:
      strength -= 40;
      break;

    case 4:
      strength -= 40;
      break;
  }

  // Check if password is the same as the username.
  if (password !== '' && password.toLowerCase() === username.toLowerCase()) {
    msg.push(translate.sameAsUsername);
    // Passwords the same as username are always very weak.
    strength = 5;
  }

  // Based on the strength, work out what text should be shown by the password strength meter.
  if (strength < 60) {
    indicatorText = translate.weak;
  } else if (strength < 70) {
    indicatorText = translate.fair;
  } else if (strength < 80) {
    indicatorText = translate.good;
  } else if (strength <= 100) {
    indicatorText = translate.strong;
  }

  // Assemble the final message.
  msg = translate.hasWeaknesses + '<ul><li>' + msg.join('</li><li>') + '</li></ul>';
  return { strength: strength, message: msg, indicatorText: indicatorText };

};

/**
 * Field instance settings screen: force the 'Display on registration form'
 * checkbox checked whenever 'Required' is checked.
 */
Drupal.behaviors.fieldUserRegistration = {
  attach: function (context, settings) {
    var $checkbox = $('form#field-ui-field-edit-form input#edit-instance-settings-user-register-form');

    if ($checkbox.length) {
      $('input#edit-instance-required', context).once('user-register-form-checkbox', function () {
        $(this).bind('change', function (e) {
          if ($(this).attr('checked')) {
            $checkbox.attr('checked', true);
          }
        });
      });

    }
  }
};

})(jQuery);
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
/**
 * @file
 * Provides JavaScript additions to the managed file field type.
 *
 * This file provides progress bar support (if available), popup windows for
 * file previews, and disabling of other file fields during Ajax uploads (which
 * prevents separate file fields from accidentally uploading files).
 */

(function ($) {

/**
 * Attach behaviors to managed file element upload fields.
 */
Drupal.behaviors.fileValidateAutoAttach = {
  attach: function (context, settings) {
    if (settings.file && settings.file.elements) {
      $.each(settings.file.elements, function(selector) {
        var extensions = settings.file.elements[selector];
        $(selector, context).bind('change', {extensions: extensions}, Drupal.file.validateExtension);
      });
    }
  },
  detach: function (context, settings) {
    if (settings.file && settings.file.elements) {
      $.each(settings.file.elements, function(selector) {
        $(selector, context).unbind('change', Drupal.file.validateExtension);
      });
    }
  }
};

/**
 * Attach behaviors to the file upload and remove buttons.
 */
Drupal.behaviors.fileButtons = {
  attach: function (context) {
    $('input.form-submit', context).bind('mousedown', Drupal.file.disableFields);
    $('div.form-managed-file input.form-submit', context).bind('mousedown', Drupal.file.progressBar);
  },
  detach: function (context) {
    $('input.form-submit', context).unbind('mousedown', Drupal.file.disableFields);
    $('div.form-managed-file input.form-submit', context).unbind('mousedown', Drupal.file.progressBar);
  }
};

/**
 * Attach behaviors to links within managed file elements.
 */
Drupal.behaviors.filePreviewLinks = {
  attach: function (context) {
    $('div.form-managed-file .file a, .file-widget .file a', context).bind('click',Drupal.file.openInNewWindow);
  },
  detach: function (context){
    $('div.form-managed-file .file a, .file-widget .file a', context).unbind('click', Drupal.file.openInNewWindow);
  }
};

/**
 * File upload utility functions.
 */
Drupal.file = Drupal.file || {
  /**
   * Client-side file input validation of file extensions.
   */
  validateExtension: function (event) {
    // Remove any previous errors.
    $('.file-upload-js-error').remove();

    // Add client side validation for the input[type=file].
    var extensionPattern = event.data.extensions.replace(/,\s*/g, '|');
    if (extensionPattern.length > 1 && this.value.length > 0) {
      var acceptableMatch = new RegExp('\\.(' + extensionPattern + ')$', 'gi');
      if (!acceptableMatch.test(this.value)) {
        var error = Drupal.t("The selected file %filename cannot be uploaded. Only files with the following extensions are allowed: %extensions.", {
          // According to the specifications of HTML5, a file upload control
          // should not reveal the real local path to the file that a user
          // has selected. Some web browsers implement this restriction by
          // replacing the local path with "C:\fakepath\", which can cause
          // confusion by leaving the user thinking perhaps Drupal could not
          // find the file because it messed up the file path. To avoid this
          // confusion, therefore, we strip out the bogus fakepath string.
          '%filename': this.value.replace('C:\\fakepath\\', ''),
          '%extensions': extensionPattern.replace(/\|/g, ', ')
        });
        $(this).closest('div.form-managed-file').prepend('<div class="messages error file-upload-js-error" aria-live="polite">' + error + '</div>');
        this.value = '';
        return false;
      }
    }
  },
  /**
   * Prevent file uploads when using buttons not intended to upload.
   */
  disableFields: function (event){
    var clickedButton = this;

    // Only disable upload fields for Ajax buttons.
    if (!$(clickedButton).hasClass('ajax-processed')) {
      return;
    }

    // Check if we're working with an "Upload" button.
    var $enabledFields = [];
    if ($(this).closest('div.form-managed-file').length > 0) {
      $enabledFields = $(this).closest('div.form-managed-file').find('input.form-file');
    }

    // Temporarily disable upload fields other than the one we're currently
    // working with. Filter out fields that are already disabled so that they
    // do not get enabled when we re-enable these fields at the end of behavior
    // processing. Re-enable in a setTimeout set to a relatively short amount
    // of time (1 second). All the other mousedown handlers (like Drupal's Ajax
    // behaviors) are excuted before any timeout functions are called, so we
    // don't have to worry about the fields being re-enabled too soon.
    // @todo If the previous sentence is true, why not set the timeout to 0?
    var $fieldsToTemporarilyDisable = $('div.form-managed-file input.form-file').not($enabledFields).not(':disabled');
    $fieldsToTemporarilyDisable.attr('disabled', 'disabled');
    setTimeout(function (){
      $fieldsToTemporarilyDisable.attr('disabled', false);
    }, 1000);
  },
  /**
   * Add progress bar support if possible.
   */
  progressBar: function (event) {
    var clickedButton = this;
    var $progressId = $(clickedButton).closest('div.form-managed-file').find('input.file-progress');
    if ($progressId.length) {
      var originalName = $progressId.attr('name');

      // Replace the name with the required identifier.
      $progressId.attr('name', originalName.match(/APC_UPLOAD_PROGRESS|UPLOAD_IDENTIFIER/)[0]);

      // Restore the original name after the upload begins.
      setTimeout(function () {
        $progressId.attr('name', originalName);
      }, 1000);
    }
    // Show the progress bar if the upload takes longer than half a second.
    setTimeout(function () {
      $(clickedButton).closest('div.form-managed-file').find('div.ajax-progress-bar').slideDown();
    }, 500);
  },
  /**
   * Open links to files within forms in a new window.
   */
  openInNewWindow: function (event) {
    $(this).attr('target', '_blank');
    window.open(this.href, 'filePreview', 'toolbar=0,scrollbars=1,location=1,statusbar=1,menubar=0,resizable=1,width=500,height=550');
    return false;
  }
};

})(jQuery);
;
/**
 * jquery.Jcrop.js v0.9.9
 * jQuery Image Cropping Plugin
 * @author Kelly Hallman <khallman@gmail.com>
 * Copyright (c) 2008-2010 Kelly Hallman - released under MIT License {{{
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:

 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.

 * }}}
 */

(function($) {

$.Jcrop = function(obj,opt)
{
	// Initialization {{{

	// Sanitize some options {{{
	var obj = obj, opt = opt;
	var myself = this;

	if (typeof(obj) !== 'object') obj = $(obj)[0];
	if (typeof(opt) !== 'object') opt = { };

	// Some on-the-fly fixes for MSIE...sigh
	if (!('trackDocument' in opt))
	{
		opt.trackDocument = $.browser.msie ? false : true;
		if ($.browser.msie && $.browser.version.split('.')[0] == '8')
			opt.trackDocument = true;
	}

	if (!('keySupport' in opt))
			opt.keySupport = $.browser.msie ? false : true;
		
	// }}}
	// Extend the default options {{{
	var defaults = {

		// Basic Settings
		trackDocument:		false,
		baseClass:			'jcrop',
		addClass:			null,

		// Styling Options
		bgColor:			'black',
		bgOpacity:			.6,
		borderOpacity:		.4,
		handleOpacity:		.5,

		handleSize:			9,
		handleOffset:		5,

		aspectRatio:		0,
		keySupport:			true,
		cornerHandles:		true,
		sideHandles:		true,
		drawBorders:		true,
		dragEdges:			true,

		boxWidth:			0,
		boxHeight:			0,
		boundary:			3,
		animationDelay:		20,
		swingSpeed:			3,

		allowSelect:		true,
		allowMove:			true,
		allowResize:		true,
		fadeTime:			400,

		minSelect:			[ 0, 0 ],
		maxSize:			[ 0, 0 ],
		minSize:			[ 0, 0 ],

		// Callbacks / Event Handlers
		onChange: function() { },
		onSelect: function() { }

	};
	var options = defaults;
	setOptions(opt);

	// }}}
	// Initialize some jQuery objects {{{

	// The values are SET on the image(s) for the interface
	// If the original image has any of these set, they will be reset
	// However, if you destroy() the Jcrop instance the original image's
	// character in the DOM will be as you left it.
	var img_css = {
		border: 'none',
		margin: 0,
		padding: 0,
		position: 'absolute'
	};

	var $origimg = $(obj);
	var $img = $origimg.clone().removeAttr('id').css(img_css);

	$img.width($origimg.width());
	$img.height($origimg.height());
	$origimg.after($img).hide();

	presize($img,options.boxWidth,options.boxHeight);

	var boundx = $img.width(),
		boundy = $img.height(),

		$div = $('<div />')
			.width(boundx).height(boundy)
			.addClass(cssClass('holder'))
			.css({
				position: 'relative',
				backgroundColor: options.bgColor
			}).insertAfter($origimg).append($img);
	;

	delete(options.bgColor);
	if (options.addClass) $div.addClass(options.addClass);

	var $img2 = $('<img />')/*{{{*/
			.attr('src',$img.attr('src'))
			.css(img_css)
			.width(boundx).height(boundy)
	;/*}}}*/
	var $img_holder = $('<div />')/*{{{*/
		.width(pct(100)).height(pct(100))
		.css({
			zIndex: 310,
			position: 'absolute',
			overflow: 'hidden'
		})
		.append($img2)
	;/*}}}*/
	var $hdl_holder = $('<div />')/*{{{*/
		.width(pct(100)).height(pct(100))
		.css('zIndex',320);
	/*}}}*/
	var $sel = $('<div />')/*{{{*/
		.css({
			position: 'absolute',
			zIndex: 300
		})
		.insertBefore($img)
		.append($img_holder,$hdl_holder)
	;/*}}}*/

	var bound = options.boundary;
	var $trk = newTracker().width(boundx+(bound*2)).height(boundy+(bound*2))
		.css({ position: 'absolute', top: px(-bound), left: px(-bound), zIndex: 290 })
		.mousedown(newSelection);	
	
	/* }}} */
	// Set more variables {{{

	var bgopacity = options.bgOpacity;
	var xlimit, ylimit, xmin, ymin;
	var xscale, yscale, enabled = true;
	var docOffset = getPos($img),
		// Internal states
		btndown, lastcurs, dimmed, animating,
		shift_down;

	// }}}

		// }}}
	// Internal Modules {{{

	var Coords = function()/*{{{*/
	{
		var x1 = 0, y1 = 0, x2 = 0, y2 = 0, ox, oy;

		function setPressed(pos)/*{{{*/
		{
			var pos = rebound(pos);
			x2 = x1 = pos[0];
			y2 = y1 = pos[1];
		};
		/*}}}*/
		function setCurrent(pos)/*{{{*/
		{
			var pos = rebound(pos);
			ox = pos[0] - x2;
			oy = pos[1] - y2;
			x2 = pos[0];
			y2 = pos[1];
		};
		/*}}}*/
		function getOffset()/*{{{*/
		{
			return [ ox, oy ];
		};
		/*}}}*/
		function moveOffset(offset)/*{{{*/
		{
			var ox = offset[0], oy = offset[1];

			if (0 > x1 + ox) ox -= ox + x1;
			if (0 > y1 + oy) oy -= oy + y1;

			if (boundy < y2 + oy) oy += boundy - (y2 + oy);
			if (boundx < x2 + ox) ox += boundx - (x2 + ox);

			x1 += ox;
			x2 += ox;
			y1 += oy;
			y2 += oy;
		};
		/*}}}*/
		function getCorner(ord)/*{{{*/
		{
			var c = getFixed();
			switch(ord)
			{
				case 'ne': return [ c.x2, c.y ];
				case 'nw': return [ c.x, c.y ];
				case 'se': return [ c.x2, c.y2 ];
				case 'sw': return [ c.x, c.y2 ];
			}
		};
		/*}}}*/
		function getFixed()/*{{{*/
		{
			if (!options.aspectRatio) return getRect();
			// This function could use some optimization I think...
			var aspect = options.aspectRatio,
				min_x = options.minSize[0]/xscale, 
				min_y = options.minSize[1]/yscale,
				max_x = options.maxSize[0]/xscale, 
				max_y = options.maxSize[1]/yscale,
				rw = x2 - x1,
				rh = y2 - y1,
				rwa = Math.abs(rw),
				rha = Math.abs(rh),
				real_ratio = rwa / rha,
				xx, yy
			;
			if (max_x == 0) { max_x = boundx * 10 }
			if (max_y == 0) { max_y = boundy * 10 }
			if (real_ratio < aspect)
			{
				yy = y2;
				w = rha * aspect;
				xx = rw < 0 ? x1 - w : w + x1;

				if (xx < 0)
				{
					xx = 0;
					h = Math.abs((xx - x1) / aspect);
					yy = rh < 0 ? y1 - h: h + y1;
				}
				else if (xx > boundx)
				{
					xx = boundx;
					h = Math.abs((xx - x1) / aspect);
					yy = rh < 0 ? y1 - h : h + y1;
				}
			}
			else
			{
				xx = x2;
				h = rwa / aspect;
				yy = rh < 0 ? y1 - h : y1 + h;
				if (yy < 0)
				{
					yy = 0;
					w = Math.abs((yy - y1) * aspect);
					xx = rw < 0 ? x1 - w : w + x1;
				}
				else if (yy > boundy)
				{
					yy = boundy;
					w = Math.abs(yy - y1) * aspect;
					xx = rw < 0 ? x1 - w : w + x1;
				}
			}

			// Magic %-)
			if(xx > x1) { // right side
			  if(xx - x1 < min_x) {
				xx = x1 + min_x;
			  } else if (xx - x1 > max_x) {
				xx = x1 + max_x;
			  }
			  if(yy > y1) {
				yy = y1 + (xx - x1)/aspect;
			  } else {
				yy = y1 - (xx - x1)/aspect;
			  }
			} else if (xx < x1) { // left side
			  if(x1 - xx < min_x) {
				xx = x1 - min_x
			  } else if (x1 - xx > max_x) {
				xx = x1 - max_x;
			  }
			  if(yy > y1) {
				yy = y1 + (x1 - xx)/aspect;
			  } else {
				yy = y1 - (x1 - xx)/aspect;
			  }
			}

			if(xx < 0) {
				x1 -= xx;
				xx = 0;
			} else  if (xx > boundx) {
				x1 -= xx - boundx;
				xx = boundx;
			}

			if(yy < 0) {
				y1 -= yy;
				yy = 0;
			} else  if (yy > boundy) {
				y1 -= yy - boundy;
				yy = boundy;
			}

			return makeObj(flipCoords(x1,y1,xx,yy));
		};
		/*}}}*/
		function rebound(p)/*{{{*/
		{
			if (p[0] < 0) p[0] = 0;
			if (p[1] < 0) p[1] = 0;

			if (p[0] > boundx) p[0] = boundx;
			if (p[1] > boundy) p[1] = boundy;

			return [ p[0], p[1] ];
		};
		/*}}}*/
		function flipCoords(x1,y1,x2,y2)/*{{{*/
		{
			var xa = x1, xb = x2, ya = y1, yb = y2;
			if (x2 < x1)
			{
				xa = x2;
				xb = x1;
			}
			if (y2 < y1)
			{
				ya = y2;
				yb = y1;
			}
			return [ Math.round(xa), Math.round(ya), Math.round(xb), Math.round(yb) ];
		};
		/*}}}*/
		function getRect()/*{{{*/
		{
			var xsize = x2 - x1;
			var ysize = y2 - y1;

			if (xlimit && (Math.abs(xsize) > xlimit))
				x2 = (xsize > 0) ? (x1 + xlimit) : (x1 - xlimit);
			if (ylimit && (Math.abs(ysize) > ylimit))
				y2 = (ysize > 0) ? (y1 + ylimit) : (y1 - ylimit);

			if (ymin && (Math.abs(ysize) < ymin))
				y2 = (ysize > 0) ? (y1 + ymin) : (y1 - ymin);
			if (xmin && (Math.abs(xsize) < xmin))
				x2 = (xsize > 0) ? (x1 + xmin) : (x1 - xmin);

			if (x1 < 0) { x2 -= x1; x1 -= x1; }
			if (y1 < 0) { y2 -= y1; y1 -= y1; }
			if (x2 < 0) { x1 -= x2; x2 -= x2; }
			if (y2 < 0) { y1 -= y2; y2 -= y2; }
			if (x2 > boundx) { var delta = x2 - boundx; x1 -= delta; x2 -= delta; }
			if (y2 > boundy) { var delta = y2 - boundy; y1 -= delta; y2 -= delta; }
			if (x1 > boundx) { var delta = x1 - boundy; y2 -= delta; y1 -= delta; }
			if (y1 > boundy) { var delta = y1 - boundy; y2 -= delta; y1 -= delta; }

			return makeObj(flipCoords(x1,y1,x2,y2));
		};
		/*}}}*/
		function makeObj(a)/*{{{*/
		{
			return { x: a[0], y: a[1], x2: a[2], y2: a[3],
				w: a[2] - a[0], h: a[3] - a[1] };
		};
		/*}}}*/

		return {
			flipCoords: flipCoords,
			setPressed: setPressed,
			setCurrent: setCurrent,
			getOffset: getOffset,
			moveOffset: moveOffset,
			getCorner: getCorner,
			getFixed: getFixed
		};
	}();

	/*}}}*/
	var Selection = function()/*{{{*/
	{
		var start, end, dragmode, awake, hdep = 370;
		var borders = { };
		var handle = { };
		var seehandles = false;
		var hhs = options.handleOffset;

		/* Insert draggable elements {{{*/

		// Insert border divs for outline
		if (options.drawBorders) {
			borders = {
					top: insertBorder('hline'),
						//.css('top',$.browser.msie?px(-1):px(0)),
					bottom: insertBorder('hline'),
					left: insertBorder('vline'),
					right: insertBorder('vline')
			};
		}

		// Insert handles on edges
		if (options.dragEdges) {
			handle.t = insertDragbar('n');
			handle.b = insertDragbar('s');
			handle.r = insertDragbar('e');
			handle.l = insertDragbar('w');
		}

		// Insert side handles
		options.sideHandles &&
			createHandles(['n','s','e','w']);

		// Insert corner handles
		options.cornerHandles &&
			createHandles(['sw','nw','ne','se']);

		/*}}}*/
		// Private Methods
		function insertBorder(type)/*{{{*/
		{
			var jq = $('<div />')
				.css({position: 'absolute', opacity: options.borderOpacity })
				.addClass(cssClass(type));
			$img_holder.append(jq);
			return jq;
		};
		/*}}}*/
		function dragDiv(ord,zi)/*{{{*/
		{
			var jq = $('<div />')
				.mousedown(createDragger(ord))
				.css({
					cursor: ord+'-resize',
					position: 'absolute',
					zIndex: zi 
				})
			;
			$hdl_holder.append(jq);
			return jq;
		};
		/*}}}*/
		function insertHandle(ord)/*{{{*/
		{
			return dragDiv(ord,hdep++)
				.css({ top: px(-hhs+1), left: px(-hhs+1), opacity: options.handleOpacity })
				.addClass(cssClass('handle'));
		};
		/*}}}*/
		function insertDragbar(ord)/*{{{*/
		{
			var s = options.handleSize,
				h = s, w = s,
				t = hhs, l = hhs;

			switch(ord)
			{
				case 'n': case 's': w = pct(100); break;
				case 'e': case 'w': h = pct(100); break;
			}

			return dragDiv(ord,hdep++).width(w).height(h)
				.css({ top: px(-t+1), left: px(-l+1)});
		};
		/*}}}*/
		function createHandles(li)/*{{{*/
		{
			for(var i=0; i< li.length; i++) handle[li[i]] = insertHandle(li[i]);
		};
		/*}}}*/
		function moveHandles(c)/*{{{*/
		{
			var midvert  = Math.round((c.h / 2) - hhs),
				midhoriz = Math.round((c.w / 2) - hhs),
				north = west = -hhs+1,
				east = c.w - hhs,
				south = c.h - hhs,
				x, y;

			'e' in handle &&
				handle.e.css({ top: px(midvert), left: px(east) }) &&
				handle.w.css({ top: px(midvert) }) &&
				handle.s.css({ top: px(south), left: px(midhoriz) }) &&
				handle.n.css({ left: px(midhoriz) });

			'ne' in handle &&
				handle.ne.css({ left: px(east) }) &&
				handle.se.css({ top: px(south), left: px(east) }) &&
				handle.sw.css({ top: px(south) });

			'b' in handle &&
				handle.b.css({ top: px(south) }) &&
				handle.r.css({ left: px(east) });
		};
		/*}}}*/
		function moveto(x,y)/*{{{*/
		{
			$img2.css({ top: px(-y), left: px(-x) });
			$sel.css({ top: px(y), left: px(x) });
		};
		/*}}}*/
		function resize(w,h)/*{{{*/
		{
			$sel.width(w).height(h);
		};
		/*}}}*/
		function refresh()/*{{{*/
		{
			var c = Coords.getFixed();

			Coords.setPressed([c.x,c.y]);
			Coords.setCurrent([c.x2,c.y2]);

			updateVisible();
		};
		/*}}}*/

		// Internal Methods
		function updateVisible()/*{{{*/
			{ if (awake) return update(); };
		/*}}}*/
		function update()/*{{{*/
		{
			var c = Coords.getFixed();

			resize(c.w,c.h);
			moveto(c.x,c.y);

			options.drawBorders &&
				borders['right'].css({ left: px(c.w-1) }) &&
					borders['bottom'].css({ top: px(c.h-1) });

			seehandles && moveHandles(c);
			awake || show();

			options.onChange.call(api,unscale(c));
		};
		/*}}}*/
		function show()/*{{{*/
		{
			$sel.show();
			$img.css('opacity',bgopacity);
			awake = true;
		};
		/*}}}*/
		function release()/*{{{*/
		{
			disableHandles();
			$sel.hide();
			$img.css('opacity',1);
			awake = false;
		};
		/*}}}*/
		function showHandles()//{{{
		{
			if (seehandles)
			{
				moveHandles(Coords.getFixed());
				$hdl_holder.show();
			}
		};
		//}}}
		function enableHandles()/*{{{*/
		{ 
			seehandles = true;
			if (options.allowResize)
			{
				moveHandles(Coords.getFixed());
				$hdl_holder.show();
				return true;
			}
		};
		/*}}}*/
		function disableHandles()/*{{{*/
		{
			seehandles = false;
			$hdl_holder.hide();
		};
		/*}}}*/
		function animMode(v)/*{{{*/
		{
			(animating = v) ? disableHandles(): enableHandles();
		};
		/*}}}*/
		function done()/*{{{*/
		{
			animMode(false);
			refresh();
		};
		/*}}}*/

		var $track = newTracker()
				.mousedown(createDragger('move'))
				.css({ cursor: 'move', position: 'absolute', zIndex: 360 });

		$img_holder.append($track);
		disableHandles();

		return {
			updateVisible: updateVisible,
			update: update,
			release: release,
			refresh: refresh,
			isAwake: function() { return awake; },
			setCursor: function (cursor) { $track.css('cursor',cursor); },
			enableHandles: enableHandles,
			enableOnly: function() { seehandles = true; },
			showHandles: showHandles,
			disableHandles: disableHandles,
			animMode: animMode,
			done: done
		};
	}();
	/*}}}*/
	var Tracker = function()/*{{{*/
	{
		var onMove		= function() { },
			onDone		= function() { },
			trackDoc	= options.trackDocument;

		if (!trackDoc)
		{
			$trk
				.mousemove(trackMove)
				.mouseup(trackUp)
				.mouseout(trackUp)
			;
		}

		function toFront()/*{{{*/
		{
			$trk.css({zIndex:450});
			if (trackDoc)
			{
				$(document)
					.mousemove(trackMove)
					.mouseup(trackUp)
				;
			}
		}
		/*}}}*/
		function toBack()/*{{{*/
		{
			$trk.css({zIndex:290});
			if (trackDoc)
			{
				$(document)
					.unbind('mousemove',trackMove)
					.unbind('mouseup',trackUp)
				;
			}
		}
		/*}}}*/
		function trackMove(e)/*{{{*/
		{
			onMove(mouseAbs(e));
		};
		/*}}}*/
		function trackUp(e)/*{{{*/
		{
			e.preventDefault();
			e.stopPropagation();

			if (btndown)
			{
				btndown = false;

				onDone(mouseAbs(e));
				//options.onSelect(unscale(Coords.getFixed()));
				options.onSelect.call(api,unscale(Coords.getFixed()));
				toBack();
				onMove = function() { };
				onDone = function() { };
			}

			return false;
		};
		/*}}}*/

		function activateHandlers(move,done)/* {{{ */
		{
			btndown = true;
			onMove = move;
			onDone = done;
			toFront();
			return false;
		};
		/* }}} */

		function setCursor(t) { $trk.css('cursor',t); };

		$img.before($trk);
		return {
			activateHandlers: activateHandlers,
			setCursor: setCursor
		};
	}();
	/*}}}*/
	var KeyManager = function()/*{{{*/
	{
		var $keymgr = $('<input type="radio" />')
				.css({ position: 'absolute', left: '-30px' })
				.keypress(parseKey)
				.blur(onBlur),

			$keywrap = $('<div />')
				.css({
					position: 'absolute',
					overflow: 'hidden'
				})
				.append($keymgr)
		;

		function watchKeys()/*{{{*/
		{
			if (options.keySupport)
			{
				$keymgr.show();
				$keymgr.focus();
			}
		};
		/*}}}*/
		function onBlur(e)/*{{{*/
		{
			$keymgr.hide();
		};
		/*}}}*/
		function doNudge(e,x,y)/*{{{*/
		{
			if (options.allowMove) {
				Coords.moveOffset([x,y]);
				Selection.updateVisible();
			};
			e.preventDefault();
			e.stopPropagation();
		};
		/*}}}*/
		function parseKey(e)/*{{{*/
		{
			if (e.ctrlKey) return true;
			shift_down = e.shiftKey ? true : false;
			var nudge = shift_down ? 10 : 1;
			switch(e.keyCode)
			{
				case 37: doNudge(e,-nudge,0); break;
				case 39: doNudge(e,nudge,0); break;
				case 38: doNudge(e,0,-nudge); break;
				case 40: doNudge(e,0,nudge); break;

				case 27: Selection.release(); break;

				case 9: return true;
			}

			return false;
		};
		/*}}}*/
		
		if (options.keySupport) $keywrap.insertBefore($img);
		return {
			watchKeys: watchKeys
		};
	}();
	/*}}}*/

	// }}}
	// Internal Methods {{{

	function px(n) { return '' + parseInt(n) + 'px'; };
	function pct(n) { return '' + parseInt(n) + '%'; };
	function cssClass(cl) { return options.baseClass + '-' + cl; };
	function supportsColorFade() { return 'backgroundColor' in $.fx.step; };
	function getPos(obj)/*{{{*/
	{
		// Updated in v0.9.4 to use built-in dimensions plugin
		var pos = $(obj).offset();
		return [ pos.left, pos.top ];
	};
	/*}}}*/
	function mouseAbs(e)/*{{{*/
	{
		return [ (e.pageX - docOffset[0]), (e.pageY - docOffset[1]) ];
	};
	/*}}}*/
	function myCursor(type)/*{{{*/
	{
		if (type != lastcurs)
		{
			Tracker.setCursor(type);
			lastcurs = type;
		}
	};
	/*}}}*/
	function startDragMode(mode,pos)/*{{{*/
	{
		docOffset = getPos($img);
		Tracker.setCursor(mode=='move'?mode:mode+'-resize');

		if (mode == 'move')
			return Tracker.activateHandlers(createMover(pos), doneSelect);

		var fc = Coords.getFixed();
		var opp = oppLockCorner(mode);
		var opc = Coords.getCorner(oppLockCorner(opp));

		Coords.setPressed(Coords.getCorner(opp));
		Coords.setCurrent(opc);

		Tracker.activateHandlers(dragmodeHandler(mode,fc),doneSelect);
	};
	/*}}}*/
	function dragmodeHandler(mode,f)/*{{{*/
	{
		return function(pos) {
			if (!options.aspectRatio) switch(mode)
			{
				case 'e': pos[1] = f.y2; break;
				case 'w': pos[1] = f.y2; break;
				case 'n': pos[0] = f.x2; break;
				case 's': pos[0] = f.x2; break;
			}
			else switch(mode)
			{
				case 'e': pos[1] = f.y+1; break;
				case 'w': pos[1] = f.y+1; break;
				case 'n': pos[0] = f.x+1; break;
				case 's': pos[0] = f.x+1; break;
			}
			Coords.setCurrent(pos);
			Selection.update();
		};
	};
	/*}}}*/
	function createMover(pos)/*{{{*/
	{
		var lloc = pos;
		KeyManager.watchKeys();

		return function(pos)
		{
			Coords.moveOffset([pos[0] - lloc[0], pos[1] - lloc[1]]);
			lloc = pos;
			
			Selection.update();
		};
	};
	/*}}}*/
	function oppLockCorner(ord)/*{{{*/
	{
		switch(ord)
		{
			case 'n': return 'sw';
			case 's': return 'nw';
			case 'e': return 'nw';
			case 'w': return 'ne';
			case 'ne': return 'sw';
			case 'nw': return 'se';
			case 'se': return 'nw';
			case 'sw': return 'ne';
		};
	};
	/*}}}*/
	function createDragger(ord)/*{{{*/
	{
		return function(e) {
			if (options.disabled) return false;
			if ((ord == 'move') && !options.allowMove) return false;
			btndown = true;
			startDragMode(ord,mouseAbs(e));
			e.stopPropagation();
			e.preventDefault();
			return false;
		};
	};
	/*}}}*/
	function presize($obj,w,h)/*{{{*/
	{
		var nw = $obj.width(), nh = $obj.height();
		if ((nw > w) && w > 0)
		{
			nw = w;
			nh = (w/$obj.width()) * $obj.height();
		}
		if ((nh > h) && h > 0)
		{
			nh = h;
			nw = (h/$obj.height()) * $obj.width();
		}
		xscale = $obj.width() / nw;
		yscale = $obj.height() / nh;
		$obj.width(nw).height(nh);
	};
	/*}}}*/
	function unscale(c)/*{{{*/
	{
		return {
			x: parseInt(c.x * xscale), y: parseInt(c.y * yscale), 
			x2: parseInt(c.x2 * xscale), y2: parseInt(c.y2 * yscale), 
			w: parseInt(c.w * xscale), h: parseInt(c.h * yscale)
		};
	};
	/*}}}*/
	function doneSelect(pos)/*{{{*/
	{
		var c = Coords.getFixed();
		if (c.w > options.minSelect[0] && c.h > options.minSelect[1])
		{
			Selection.enableHandles();
			Selection.done();
		}
		else
		{
			Selection.release();
		}
		Tracker.setCursor( options.allowSelect?'crosshair':'default' );
	};
	/*}}}*/
	function newSelection(e)/*{{{*/
	{
		if (options.disabled) return false;
		if (!options.allowSelect) return false;
		btndown = true;
		docOffset = getPos($img);
		Selection.disableHandles();
		myCursor('crosshair');
		var pos = mouseAbs(e);
		Coords.setPressed(pos);
		Selection.update();
		Tracker.activateHandlers(selectDrag,doneSelect);
		KeyManager.watchKeys();

		e.stopPropagation();
		e.preventDefault();
		return false;
	};
	/*}}}*/
	function selectDrag(pos)/*{{{*/
	{
		Coords.setCurrent(pos);
		Selection.update();
	};
	/*}}}*/
	function newTracker()/*{{{*/
	{
		var trk = $('<div></div>').addClass(cssClass('tracker'));
		$.browser.msie && trk.css({ opacity: 0, backgroundColor: 'white' });
		return trk;
	};
	/*}}}*/

	// }}}
	// API methods {{{
		
	function setClass(cname)/*{{{*/
	{
		$div.removeClass()
			.addClass(cssClass('holder'))
			.addClass(cname);
	}
	;/*}}}*/
	function animateTo(a,callback)/*{{{*/
	{
		var x1 = parseInt(a[0]) / xscale,
			y1 = parseInt(a[1]) / yscale,
			x2 = parseInt(a[2]) / xscale,
			y2 = parseInt(a[3]) / yscale;

		if (animating) return;

		var animto = Coords.flipCoords(x1,y1,x2,y2);
		var c = Coords.getFixed();
		var animat = initcr = [ c.x, c.y, c.x2, c.y2 ];
		var interv = options.animationDelay;

		var x = animat[0];
		var y = animat[1];
		var x2 = animat[2];
		var y2 = animat[3];
		var ix1 = animto[0] - initcr[0];
		var iy1 = animto[1] - initcr[1];
		var ix2 = animto[2] - initcr[2];
		var iy2 = animto[3] - initcr[3];
		var pcent = 0;
		var velocity = options.swingSpeed;

		Selection.animMode(true);
		var anim_timer;

		var animator = function()
		{
			return function()
			{
				pcent += (100 - pcent) / velocity;

				animat[0] = x + ((pcent / 100) * ix1);
				animat[1] = y + ((pcent / 100) * iy1);
				animat[2] = x2 + ((pcent / 100) * ix2);
				animat[3] = y2 + ((pcent / 100) * iy2);

				if (pcent >= 99.8) pcent = 100;
				if (pcent < 100)
				{
					setSelectRaw(animat);
				}
				else {
					clearInterval(anim_timer);
					Selection.done();
					if (typeof(callback)=='function') callback.call(api);
				}

			};
		}();

		anim_timer = setInterval(animator,interv);
	};
	/*}}}*/
	function setSelect(rect)//{{{
	{
		setSelectRaw([
			parseInt(rect[0])/xscale,
			parseInt(rect[1])/yscale,
			parseInt(rect[2])/xscale,
			parseInt(rect[3])/yscale
		]);
	};
	//}}}
	function setSelectRaw(l) /*{{{*/
	{
		Coords.setPressed([l[0],l[1]]);
		Coords.setCurrent([l[2],l[3]]);
		Selection.update();
	};
	/*}}}*/
	function setOptions(opt)/*{{{*/
	{
		if (typeof(opt) != 'object') opt = { };
		options = $.extend(options,opt);

		if (typeof(options.onChange)!=='function')
			options.onChange = function() { };

		if (typeof(options.onSelect)!=='function')
			options.onSelect = function() { };

	};
	/*}}}*/
	function tellSelect()/*{{{*/
	{
		return unscale(Coords.getFixed());
	};
	/*}}}*/
	function tellScaled()/*{{{*/
	{
		return Coords.getFixed();
	};
	/*}}}*/
	function setOptionsNew(opt)/*{{{*/
	{
		setOptions(opt);
		interfaceUpdate();
	};
	/*}}}*/
	function disableCrop()//{{{
	{
		options.disabled = true;
		Selection.disableHandles();
		Selection.setCursor('default');
		Tracker.setCursor('default');
	};
	//}}}
	function enableCrop()//{{{
	{
		options.disabled = false;
		interfaceUpdate();
	};
	//}}}
	function cancelCrop()//{{{
	{
		Selection.done();
		Tracker.activateHandlers(null,null);
	};
	//}}}
	function destroy()//{{{
	{
		$div.remove();
		$origimg.show();
		$(obj).removeData('Jcrop');
	};
	//}}}
	function setImage(src,callback)//{{{
	{
		Selection.release();
		disableCrop();
		var img = new Image();
		img.onload = function()
		{
			var iw = img.width;
			var ih = img.height;
			var bw = options.boxWidth;
			var bh = options.boxHeight;
			$img.width(iw).height(ih);
			$img.attr('src',src);
			$img2.attr('src',src);
			presize($img,bw,bh);
			boundx = $img.width();
			boundy = $img.height();
			$img2.width(boundx).height(boundy);
			$trk.width(boundx+(bound*2)).height(boundy+(bound*2));
			$div.width(boundx).height(boundy);
			enableCrop();

			(typeof(callback) == 'function') && callback.call(api);
		};
		img.src = src;
	};
	//}}}
	function interfaceUpdate(alt)//{{{
	// This method tweaks the interface based on options object.
	// Called when options are changed and at end of initialization.
	{
		options.allowResize ?
			alt?Selection.enableOnly():Selection.enableHandles():
			Selection.disableHandles();

		Tracker.setCursor( options.allowSelect? 'crosshair': 'default' );
		Selection.setCursor( options.allowMove? 'move': 'default' );


		if ('setSelect' in options) {
			setSelect(options.setSelect);
			Selection.done();
			delete(options.setSelect);
		}

		if ('trueSize' in options) {
			xscale = options.trueSize[0] / boundx;
			yscale = options.trueSize[1] / boundy;
		}
		if ('bgColor' in options) {

			(supportsColorFade() && options.fadeTime) ?
				$div.animate({backgroundColor: options.bgColor},
					{queue:false,duration:options.fadeTime}) :
				$div.css('backgroundColor',options.bgColor);

			delete(options.bgColor);
		};
		if ('bgOpacity' in options) {
			bgopacity = options.bgOpacity;

			if (Selection.isAwake())
				(options.fadeTime) ? $img.fadeTo(options.fadeTime,bgopacity):
					$div.css('opacity',options.opacity);

			delete(options.bgOpacity);
		};

		xlimit = options.maxSize[0] || 0;
		ylimit = options.maxSize[1] || 0;
		xmin = options.minSize[0] || 0;
		ymin = options.minSize[1] || 0;

		if ('outerImage' in options)
		{
			$img.attr('src',options.outerImage);
			delete(options.outerImage);
		}

		Selection.refresh();
	};
	//}}}

	// }}}

	$hdl_holder.hide();
	interfaceUpdate(true);
	
	var api = {

		setImage: setImage,
		animateTo: animateTo,
		setSelect: setSelect,
		setOptions: setOptionsNew,
		tellSelect: tellSelect,
		tellScaled: tellScaled,
		setClass: setClass,

		disable: disableCrop,
		enable: enableCrop,
		cancel: cancelCrop,
		release: Selection.release,
		destroy: destroy,

		focus: KeyManager.watchKeys,

		getBounds: function() { return [ boundx * xscale, boundy * yscale ]; },
		getWidgetSize: function() { return [ boundx, boundy ]; },
		getScaleFactor: function() { return [ xscale, yscale ]; },

		ui: {
			holder: $div,
			selection: $sel
		}

	};

	$origimg.data('Jcrop',api);
	return api;
};

$.fn.Jcrop = function(options,callback)/*{{{*/
{

	function attachWhenDone(from)/*{{{*/
	{
		var opt = (typeof(options) == 'object') ? options : { };
		var loadsrc = opt.useImg || from.src;
		var img = new Image();
		img.onload = function() {
			var api = $.Jcrop(from,opt);

			(typeof(callback) == 'function') &&
				callback.call(api);
		};
		img.src = loadsrc;
	};
	/*}}}*/

	// Iterate over each object, attach Jcrop
	this.each(function()
	{
		// If we've already attached to this object
		if ($(this).data('Jcrop'))
		{
			// The API can be requested this way (undocumented)
			if (options == 'api') return $(this).data('Jcrop');
			// Otherwise, we just reset the options...
			else $(this).data('Jcrop').setOptions(options);
		}
		// If we haven't been attached, preload and attach
		else attachWhenDone(this);
	});

	// Return "this" so we're chainable a la jQuery plugin-style!
	return this;
};
/*}}}*/

})(jQuery);
;
(function ($) {
/**
 * @file
 * Imagefield_crop module js
 *
 * JS for cropping image widget
 */
Drupal.behaviors.imagefield_crop = {
  attach: function (context, settings) {
    // wait till 'fadeIn' effect ends (defined in filefield_widget.inc)
    setTimeout(attachJcrop, 1000, context);
    //attachJcrop(context);

    function attachJcrop(context) {
      if ($('.cropbox', context).length == 0) {
        // no cropbox, probably an image upload (http://drupal.org/node/366296)
        return;
      }
      // add Jcrop exactly once to each cropbox
      $('.cropbox', context).once(function() {
        var self = $(this);

        //alert("found a cropbox" + self.attr('id'));

        // get the id attribute for multiple image support
        var self_id = self.attr('id');
        var id = self_id.substring(0, self_id.indexOf('-cropbox'));
        // get the name attribute for imagefield name
        var widget = self.parent().parent();

          if ($(".edit-image-crop-changed", widget).val() == 1) {
              $('.preview-existing', widget).css({display: 'none'});
              $('.jcrop-preview', widget).css({display: 'block'});
          }

        $(this).Jcrop({
          onChange: function(c) {
            $('.preview-existing', widget).css({display: 'none'});
            var preview = $('.imagefield-crop-preview', widget);
            // skip newly added blank fields
            if (undefined == settings.imagefield_crop[id].preview) {
              return;
            }
            var rx = settings.imagefield_crop[id].preview.width / c.w;
            var ry = settings.imagefield_crop[id].preview.height / c.h;
            $('.jcrop-preview', preview).css({
              width: Math.round(rx * settings.imagefield_crop[id].preview.orig_width) + 'px',
              height: Math.round(ry * settings.imagefield_crop[id].preview.orig_height) + 'px',
              marginLeft: '-' + Math.round(rx * c.x) + 'px',
              marginTop: '-' + Math.round(ry * c.y) + 'px',
              display: 'block'
            });
            // Crop image even if user has left image untouched.
            $(widget).siblings('.preview-existing').css({display: 'none'});
            $(widget).siblings(".edit-image-crop-x").val(c.x);
            $(widget).siblings(".edit-image-crop-y").val(c.y);
            if (c.w) $(widget).siblings(".edit-image-crop-width").val(c.w);
            if (c.h) $(widget).siblings(".edit-image-crop-height").val(c.h);
            $(widget).siblings(".edit-image-crop-changed").val(1);
          },
          onSelect: function(c) {
            $(widget).siblings('.preview-existing').css({display: 'none'});
            $(widget).siblings(".edit-image-crop-x").val(c.x);
            $(widget).siblings(".edit-image-crop-y").val(c.y);
            if (c.w) $(widget).siblings(".edit-image-crop-width").val(c.w);
            if (c.h) $(widget).siblings(".edit-image-crop-height").val(c.h);
            $(widget).siblings(".edit-image-crop-changed").val(1);
          },
          aspectRatio: settings.imagefield_crop[id].box.ratio,
          boxWidth: settings.imagefield_crop[id].box.box_width,
          boxHeight: settings.imagefield_crop[id].box.box_height,
          minSize: [Drupal.settings.imagefield_crop[id].minimum.width, Drupal.settings.imagefield_crop[id].minimum.height], 
          /*
           * Setting the select here calls onChange event, and we lose the original image visibility
          */
          setSelect: [
            parseInt($(widget).siblings(".edit-image-crop-x").val()),
            parseInt($(widget).siblings(".edit-image-crop-y").val()),
            parseInt($(widget).siblings(".edit-image-crop-width").val()) + parseInt($(widget).siblings(".edit-image-crop-x").val()),
            parseInt($(widget).siblings(".edit-image-crop-height").val()) + parseInt($(widget).siblings(".edit-image-crop-y").val())
          ]
        });
      });
    };
  }
};

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

Drupal.toolbar = Drupal.toolbar || {};

/**
 * Attach toggling behavior and notify the overlay of the toolbar.
 */
Drupal.behaviors.toolbar = {
  attach: function(context) {

    // Set the initial state of the toolbar.
    $('#toolbar', context).once('toolbar', Drupal.toolbar.init);

    // Toggling toolbar drawer.
    $('#toolbar a.toggle', context).once('toolbar-toggle').click(function(e) {
      Drupal.toolbar.toggle();
      // Allow resize event handlers to recalculate sizes/positions.
      $(window).triggerHandler('resize');
      return false;
    });
  }
};

/**
 * Retrieve last saved cookie settings and set up the initial toolbar state.
 */
Drupal.toolbar.init = function() {
  // Retrieve the collapsed status from a stored cookie.
  var collapsed = $.cookie('Drupal.toolbar.collapsed');

  // Expand or collapse the toolbar based on the cookie value.
  if (collapsed == 1) {
    Drupal.toolbar.collapse();
  }
  else {
    Drupal.toolbar.expand();
  }
};

/**
 * Collapse the toolbar.
 */
Drupal.toolbar.collapse = function() {
  var toggle_text = Drupal.t('Show shortcuts');
  $('#toolbar div.toolbar-drawer').addClass('collapsed');
  $('#toolbar a.toggle')
    .removeClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').removeClass('toolbar-drawer').css('paddingTop', Drupal.toolbar.height());
  $.cookie(
    'Drupal.toolbar.collapsed',
    1,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
};

/**
 * Expand the toolbar.
 */
Drupal.toolbar.expand = function() {
  var toggle_text = Drupal.t('Hide shortcuts');
  $('#toolbar div.toolbar-drawer').removeClass('collapsed');
  $('#toolbar a.toggle')
    .addClass('toggle-active')
    .attr('title',  toggle_text)
    .html(toggle_text);
  $('body').addClass('toolbar-drawer').css('paddingTop', Drupal.toolbar.height());
  $.cookie(
    'Drupal.toolbar.collapsed',
    0,
    {
      path: Drupal.settings.basePath,
      // The cookie should "never" expire.
      expires: 36500
    }
  );
};

/**
 * Toggle the toolbar.
 */
Drupal.toolbar.toggle = function() {
  if ($('#toolbar div.toolbar-drawer').hasClass('collapsed')) {
    Drupal.toolbar.expand();
  }
  else {
    Drupal.toolbar.collapse();
  }
};

Drupal.toolbar.height = function() {
  var $toolbar = $('#toolbar');
  var height = $toolbar.outerHeight();
  // In modern browsers (including IE9), when box-shadow is defined, use the
  // normal height.
  var cssBoxShadowValue = $toolbar.css('box-shadow');
  var boxShadow = (typeof cssBoxShadowValue !== 'undefined' && cssBoxShadowValue !== 'none');
  // In IE8 and below, we use the shadow filter to apply box-shadow styles to
  // the toolbar. It adds some extra height that we need to remove.
  if (!boxShadow && /DXImageTransform\.Microsoft\.Shadow/.test($toolbar.css('filter'))) {
    height -= $toolbar[0].filters.item("DXImageTransform.Microsoft.Shadow").strength;
  }
  return height;
};

})(jQuery);
;
