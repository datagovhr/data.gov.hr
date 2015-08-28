Drupal.locale = { 'pluralFormula': function ($n) { return Number((((($n%10)==1)&&(($n%100)!=11))?(0):((((($n%10)>=2)&&(($n%10)<=4))&&((($n%100)<10)||(($n%100)>=20)))?(1):2))); }, 'strings': {"":{"An AJAX HTTP error occurred.":"Nastala je AJAX HTTP gre\u0161ka.","HTTP Result Code: !status":"HTTP kod: !status","An AJAX HTTP request terminated abnormally.":"AJAX HTTP zahtjev je nenormalno zavr\u0161io.","Debugging information follows.":"Slijede debug informacije.","Path: !uri":"Putanja: !uri","StatusText: !statusText":"StatusTekst: !statusText","ResponseText: !responseText":"ResponseText: !responseText","ReadyState: !readyState":"ReadyState: !readyState","Configure":"Konfiguriraj","Please wait...":"Molimo pri\u010dekajte...","Quick edit":"Brzo ure\u0111ivanje","OK":"U redu","Sorry!":"Ispri\u010davamo se","Discard changes?":"Odbaciti promjene?","You have unsaved changes":"Imate nespremljene promjene","Save":"Spremi","Discard changes":"Odbaciti promjene","Saving":"Spremanje u toku","Close":"Zatvoriti","Re-order rows by numerical weight instead of dragging.":"Prerasporedi redove po broj\u010danoj te\u017eini umjesto povla\u010denja.","Show row weights":"Prika\u017ei te\u017einu redova","Hide row weights":"Sakrij te\u017einu redova","Drag to re-order":"Povucite kako bi prerasporedili","Changes made in this table will not be saved until the form is submitted.":"Promjene u ovoj tablici ne\u0107e biti spremljene dok se obrazac ne otpremi.","Hide":"Sakrij","Show":"Prika\u017ei","(active tab)":"(aktivni tab)","Also allow !name role to !permission?":"Tako\u0111er dopusti !permission !name ulozi?","This permission is inherited from the authenticated user role.":"Ovo dopu\u0161tenje je naslije\u0111eno iz korisni\u010dke uloge.","Select all rows in this table":"Ozna\u010dite sve redove u tablici","Deselect all rows in this table":"Poni\u0161ti izbor svih redova u ovoj tablici","The selected file %filename cannot be uploaded. Only files with the following extensions are allowed: %extensions.":"Odabrana datoteka %filename nije mogla biti otpremljena. Samo datoteke sa sljede\u0107im nastavcima su dopu\u0161tene: %extensions.","Autocomplete popup":"Isko\u010dnik samodovr\u0161etka","Searching for matches...":"Tra\u017eim...","none":"ni\u0161ta","Loading token browser...":"U\u010ditavanje token preglednika...","Available tokens":"Dostupni tokeni","Insert this token into your form":"Stavite token u svoj obrazac","First click a text field to insert your tokens into.":"Prvo kliknuti na polje teksta kako bi ubacili tokene u nj.","Edit":"Uredi","Requires a title":"Naziv je nu\u017ean","Not published":"Nije objavljeno","Don\u0027t display post information":"Ne prikazuj informacije o unosu","Next":"Sljede\u0107i","Disabled":"Onemogu\u0107eno","Enabled":"Omogu\u0107eno","Sunday":"Nedjelja","Monday":"Ponedjeljak","Tuesday":"Utorak","Wednesday":"Srijeda","Thursday":"\u010cetvrtak","Friday":"Petak","Saturday":"Subota","Add":"Dodaj","Done":"Gotovo","Prev":"Predhodni","Mon":"Pon","Tue":"Uto","Wed":"Sri","Thu":"\u010cet","Fri":"Pet","Sat":"Sub","Sun":"Ned","January":"Sije\u010danj","February":"Velja\u010da","March":"O\u017eujak","April":"Travanj","May":"Svibanj","June":"Lipanj","July":"Srpanj","August":"Kolovoz","September":"Rujan","October":"Listopad","November":"Studeni","December":"Prosinac","Your search yielded no results":"Nema rezultata za tra\u017eenu pretragu","Today":"Danas","Jan":"Sij","Feb":"Velj","Mar":"O\u017eu","Apr":"Tra","Jun":"Lip","Jul":"Srp","Aug":"Kol","Sep":"Ruj","Oct":"Lis","Nov":"Stu","Dec":"Pro","Su":"Ne","Mo":"Po","Tu":"Ut","We":"Sr","Th":"\u010ce","Fr":"Pe","Sa":"Su","mm\/dd\/yy":"mm\/dd\/gg","Not in book":"Nije unutar knjige","New book":"Nova knjiga","By @name on @date":"Od @name u @date","By @name":"Od @name","Not in menu":"Nije u izborniku","Alias: @alias":"Nadimak: @alias","No alias":"Nema nadimka","New revision":"Nova revizija","The changes to these blocks will not be saved until the \u003Cem\u003ESave blocks\u003C\/em\u003E button is clicked.":"Promjene na ovim blokovima ne\u0107e biti sa\u010duvane sve dok ne kliknete na dugme \u003Cem\u003ESpremi blokove\u003C\/em\u003E.","Show shortcuts":"Prika\u017ei pre\u010dace","No revision":"Nema revizije","@number comments per page":"@number komentara po stranici","Not restricted":"Nije ograni\u010deno","Not customizable":"Nije prilagodljivo","Restricted to certain pages":"Ograni\u010deno na odre\u0111ene stranice","The block cannot be placed in this region.":"Blok ne mo\u017ee biti postavljen u ovu regiju.","Hide summary":"Sakrij sa\u017eetak","Edit summary":"Uredi sa\u017eetak","Hide shortcuts":"Sakrij pre\u010dace","Select all":"Odaberi sve","\u00ab Prev":"\u003C\u003C Pro\u0161li","Next \u00bb":"Slje \u003E\u003E"}} };;

/**
 * Adds the custom autocomplete widget behavior.
 */
 Drupal.apachesolr_autocomplete = {
   processOne: function(key, settings, context) {
      // Look for items with the data-apachesolr-autocomplete-id attribute.
      jQuery(".apachesolr-autocomplete[data-apachesolr-autocomplete-id='"+ key +"']", context)
      .autocomplete(settings.path, {
      // Classnames for the widget.
      inputClass: "",
      loadingClass: "throbbing",
      // Do not select first suggestion by default.
      selectFirst: false,
      // Specify no matching as it wil be done on server-side.
      matchContains: false,
      matchSubset: false,
      // Maximum number of items to show in widget.
      max: 50,
      scroll: true,
      scrollHeight: 360,
      // Data returned from server is JSON-encoded.
      dataType: "json",
      // Function to parse returned json into elements.
      parse: function(data) {
        return jQuery.map(data, function(item) {
          return {
            data: item,          // Echo the input data.
            value: item.display, // This will be shown in the options widget.
            result: item.key     // The actual value to put into the form element.
          }
        });
      },
      // Return the HTML to display in the options widget.
      formatItem: function(item) {
        return item.display;
      }
    }).result(function(item, element) {
      // Handle selection of an element in the autocomplete widget.
      // We should submit the widget's parent form.
      jQuery(this).get(0).form.submit();
    }).addClass('form-autocomplete'); // Add Drupal autocomplete widget's style.
  }
}
Drupal.behaviors.apachesolr_autocomplete = {
    attach: function(context) {
      // Check that settings exist.
      if (! Drupal.settings.apachesolr_autocomplete) {
        return;
      }
      // Cycle thru the settings array which contains:
      //   key => settingsArray
      // where
      //   key: the data-apachesolr-autocomplete-id HTML attribute to look for
      //        (which was added on the form_alter)
      //   settings: and
      jQuery.each(Drupal.settings.apachesolr_autocomplete, function (key, settings) {
        Drupal.apachesolr_autocomplete.processOne(key, settings, context);
      });
    }
};
;
/*
 * jQuery Autocomplete plugin 1.1
 *
 * Copyright (c) 2009 Jörn Zaefferer
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

;(function($) {
	
$.fn.extend({
	autocomplete: function(urlOrData, options) {
		var isUrl = typeof urlOrData == "string";
		options = $.extend({}, $.Autocompleter.defaults, {
			url: isUrl ? urlOrData : null,
			data: isUrl ? null : urlOrData,
			delay: isUrl ? $.Autocompleter.defaults.delay : 10,
			max: options && !options.scroll ? 10 : 150
		}, options);
		
		// if highlight is set to false, replace it with a do-nothing function
		options.highlight = options.highlight || function(value) { return value; };
		
		// if the formatMatch option is not specified, then use formatItem for backwards compatibility
		options.formatMatch = options.formatMatch || options.formatItem;
		
		return this.each(function() {
			new $.Autocompleter(this, options);
		});
	},
	result: function(handler) {
		return this.bind("result", handler);
	},
	search: function(handler) {
		return this.trigger("search", [handler]);
	},
	flushCache: function() {
		return this.trigger("flushCache");
	},
	setOptions: function(options){
		return this.trigger("setOptions", [options]);
	},
	unautocomplete: function() {
		return this.trigger("unautocomplete");
	}
});

$.Autocompleter = function(input, options) {

	var KEY = {
		UP: 38,
		DOWN: 40,
		DEL: 46,
		TAB: 9,
		RETURN: 13,
		ESC: 27,
		COMMA: 188,
		PAGEUP: 33,
		PAGEDOWN: 34,
		BACKSPACE: 8
	};

	// Create $ object for input element
	var $input = $(input).attr("autocomplete", "off").addClass(options.inputClass);

	var timeout;
	var previousValue = "";
	var cache = $.Autocompleter.Cache(options);
	var hasFocus = 0;
	var lastKeyPressCode;
	var config = {
		mouseDownOnSelect: false
	};
	var select = $.Autocompleter.Select(options, input, selectCurrent, config);
	
	var blockSubmit;
	
	// prevent form submit in opera when selecting with return key
	$.browser.opera && $(input.form).bind("submit.autocomplete", function() {
		if (blockSubmit) {
			blockSubmit = false;
			return false;
		}
	});
	
	// only opera doesn't trigger keydown multiple times while pressed, others don't work with keypress at all
	$input.bind(($.browser.opera ? "keypress" : "keydown") + ".autocomplete", function(event) {
		// a keypress means the input has focus
		// avoids issue where input had focus before the autocomplete was applied
		hasFocus = 1;
		// track last key pressed
		lastKeyPressCode = event.keyCode;
		switch(event.keyCode) {
		
			case KEY.UP:
				event.preventDefault();
				if ( select.visible() ) {
					select.prev();
				} else {
					onChange(0, true);
				}
				break;
				
			case KEY.DOWN:
				event.preventDefault();
				if ( select.visible() ) {
					select.next();
				} else {
					onChange(0, true);
				}
				break;
				
			case KEY.PAGEUP:
				event.preventDefault();
				if ( select.visible() ) {
					select.pageUp();
				} else {
					onChange(0, true);
				}
				break;
				
			case KEY.PAGEDOWN:
				event.preventDefault();
				if ( select.visible() ) {
					select.pageDown();
				} else {
					onChange(0, true);
				}
				break;
			
			// matches also semicolon
			case options.multiple && $.trim(options.multipleSeparator) == "," && KEY.COMMA:
			case KEY.TAB:
			case KEY.RETURN:
				if( selectCurrent() ) {
					// stop default to prevent a form submit, Opera needs special handling
					event.preventDefault();
					blockSubmit = true;
					return false;
				}
				break;
				
			case KEY.ESC:
				select.hide();
				break;
				
			default:
				clearTimeout(timeout);
				timeout = setTimeout(onChange, options.delay);
				break;
		}
	}).focus(function(){
		// track whether the field has focus, we shouldn't process any
		// results if the field no longer has focus
		hasFocus++;
	}).blur(function() {
		hasFocus = 0;
		if (!config.mouseDownOnSelect) {
			hideResults();
		}
	}).click(function() {
		// show select when clicking in a focused field
		if ( hasFocus++ > 1 && !select.visible() ) {
			onChange(0, true);
		}
	}).bind("search", function() {
		// TODO why not just specifying both arguments?
		var fn = (arguments.length > 1) ? arguments[1] : null;
		function findValueCallback(q, data) {
			var result;
			if( data && data.length ) {
				for (var i=0; i < data.length; i++) {
					if( data[i].result.toLowerCase() == q.toLowerCase() ) {
						result = data[i];
						break;
					}
				}
			}
			if( typeof fn == "function" ) fn(result);
			else $input.trigger("result", result && [result.data, result.value]);
		}
		$.each(trimWords($input.val()), function(i, value) {
			request(value, findValueCallback, findValueCallback);
		});
	}).bind("flushCache", function() {
		cache.flush();
	}).bind("setOptions", function() {
		$.extend(options, arguments[1]);
		// if we've updated the data, repopulate
		if ( "data" in arguments[1] )
			cache.populate();
	}).bind("unautocomplete", function() {
		select.unbind();
		$input.unbind();
		$(input.form).unbind(".autocomplete");
	});
	
	
	function selectCurrent() {
		var selected = select.selected();
		if( !selected )
			return false;
		
		var v = selected.result;
		previousValue = v;
		
		if ( options.multiple ) {
			var words = trimWords($input.val());
			if ( words.length > 1 ) {
				var seperator = options.multipleSeparator.length;
				var cursorAt = $(input).selection().start;
				var wordAt, progress = 0;
				$.each(words, function(i, word) {
					progress += word.length;
					if (cursorAt <= progress) {
						wordAt = i;
						return false;
					}
					progress += seperator;
				});
				words[wordAt] = v;
				// TODO this should set the cursor to the right position, but it gets overriden somewhere
				//$.Autocompleter.Selection(input, progress + seperator, progress + seperator);
				v = words.join( options.multipleSeparator );
			}
			v += options.multipleSeparator;
		}
		
		$input.val(v);
		hideResultsNow();
		$input.trigger("result", [selected.data, selected.value]);
		return true;
	}
	
	function onChange(crap, skipPrevCheck) {
		if( lastKeyPressCode == KEY.DEL ) {
			select.hide();
			return;
		}
		
		var currentValue = $input.val();
		
		if ( !skipPrevCheck && currentValue == previousValue )
			return;
		
		previousValue = currentValue;
		
		currentValue = lastWord(currentValue);
		if ( currentValue.length >= options.minChars) {
			$input.addClass(options.loadingClass);
			if (!options.matchCase)
				currentValue = currentValue.toLowerCase();
			request(currentValue, receiveData, hideResultsNow);
		} else {
			stopLoading();
			select.hide();
		}
	};
	
	function trimWords(value) {
		if (!value)
			return [""];
		if (!options.multiple)
			return [$.trim(value)];
		return $.map(value.split(options.multipleSeparator), function(word) {
			return $.trim(value).length ? $.trim(word) : null;
		});
	}
	
	function lastWord(value) {
		if ( !options.multiple )
			return value;
		var words = trimWords(value);
		if (words.length == 1) 
			return words[0];
		var cursorAt = $(input).selection().start;
		if (cursorAt == value.length) {
			words = trimWords(value)
		} else {
			words = trimWords(value.replace(value.substring(cursorAt), ""));
		}
		return words[words.length - 1];
	}
	
	// fills in the input box w/the first match (assumed to be the best match)
	// q: the term entered
	// sValue: the first matching result
	function autoFill(q, sValue){
		// autofill in the complete box w/the first match as long as the user hasn't entered in more data
		// if the last user key pressed was backspace, don't autofill
		if( options.autoFill && (lastWord($input.val()).toLowerCase() == q.toLowerCase()) && lastKeyPressCode != KEY.BACKSPACE ) {
			// fill in the value (keep the case the user has typed)
			$input.val($input.val() + sValue.substring(lastWord(previousValue).length));
			// select the portion of the value not typed by the user (so the next character will erase)
			$(input).selection(previousValue.length, previousValue.length + sValue.length);
		}
	};

	function hideResults() {
		clearTimeout(timeout);
		timeout = setTimeout(hideResultsNow, 200);
	};

	function hideResultsNow() {
		var wasVisible = select.visible();
		select.hide();
		clearTimeout(timeout);
		stopLoading();
		if (options.mustMatch) {
			// call search and run callback
			$input.search(
				function (result){
					// if no value found, clear the input box
					if( !result ) {
						if (options.multiple) {
							var words = trimWords($input.val()).slice(0, -1);
							$input.val( words.join(options.multipleSeparator) + (words.length ? options.multipleSeparator : "") );
						}
						else {
							$input.val( "" );
							$input.trigger("result", null);
						}
					}
				}
			);
		}
	};

	function receiveData(q, data) {
		if ( data && data.length && hasFocus ) {
			stopLoading();
			select.display(data, q);
			autoFill(q, data[0].value);
			select.show();
		} else {
			hideResultsNow();
		}
	};

	function request(term, success, failure) {
		if (!options.matchCase)
			term = term.toLowerCase();
		var data = cache.load(term);
		// recieve the cached data
		if (data && data.length) {
			success(term, data);
		// if an AJAX url has been supplied, try loading the data now
		} else if( (typeof options.url == "string") && (options.url.length > 0) ){
			
			var extraParams = {
				timestamp: +new Date()
			};
			$.each(options.extraParams, function(key, param) {
				extraParams[key] = typeof param == "function" ? param() : param;
			});
			
			$.ajax({
				// try to leverage ajaxQueue plugin to abort previous requests
				mode: "abort",
				// limit abortion to this input
				port: "autocomplete" + input.name,
				dataType: options.dataType,
				url: options.url,
				data: $.extend({
					query: lastWord(term),
					limit: options.max
				}, extraParams),
				success: function(data) {
					var parsed = options.parse && options.parse(data) || parse(data);
					cache.add(term, parsed);
					success(term, parsed);
				}
			});
		} else {
			// if we have a failure, we need to empty the list -- this prevents the the [TAB] key from selecting the last successful match
			select.emptyList();
			failure(term);
		}
	};
	
	function parse(data) {
		var parsed = [];
		var rows = data.split("\n");
		for (var i=0; i < rows.length; i++) {
			var row = $.trim(rows[i]);
			if (row) {
				row = row.split("|");
				parsed[parsed.length] = {
					data: row,
					value: row[0],
					result: options.formatResult && options.formatResult(row, row[0]) || row[0]
				};
			}
		}
		return parsed;
	};

	function stopLoading() {
		$input.removeClass(options.loadingClass);
	};

};

$.Autocompleter.defaults = {
	inputClass: "ac_input",
	resultsClass: "ac_results",
	loadingClass: "ac_loading",
	minChars: 1,
	delay: 400,
	matchCase: false,
	matchSubset: true,
	matchContains: false,
	cacheLength: 10,
	max: 100,
	mustMatch: false,
	extraParams: {},
	selectFirst: true,
	formatItem: function(row) { return row[0]; },
	formatMatch: null,
	autoFill: false,
	width: 0,
	multiple: false,
	multipleSeparator: ", ",
	highlight: function(value, term) {
		return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>");
	},
    scroll: true,
    scrollHeight: 180
};

$.Autocompleter.Cache = function(options) {

	var data = {};
	var length = 0;
	
	function matchSubset(s, sub) {
		if (!options.matchCase) 
			s = s.toLowerCase();
		var i = s.indexOf(sub);
		if (options.matchContains == "word"){
			i = s.toLowerCase().search("\\b" + sub.toLowerCase());
		}
		if (i == -1) return false;
		return i == 0 || options.matchContains;
	};
	
	function add(q, value) {
		if (length > options.cacheLength){
			flush();
		}
		if (!data[q]){ 
			length++;
		}
		data[q] = value;
	}
	
	function populate(){
		if( !options.data ) return false;
		// track the matches
		var stMatchSets = {},
			nullData = 0;

		// no url was specified, we need to adjust the cache length to make sure it fits the local data store
		if( !options.url ) options.cacheLength = 1;
		
		// track all options for minChars = 0
		stMatchSets[""] = [];
		
		// loop through the array and create a lookup structure
		for ( var i = 0, ol = options.data.length; i < ol; i++ ) {
			var rawValue = options.data[i];
			// if rawValue is a string, make an array otherwise just reference the array
			rawValue = (typeof rawValue == "string") ? [rawValue] : rawValue;
			
			var value = options.formatMatch(rawValue, i+1, options.data.length);
			if ( value === false )
				continue;
				
			var firstChar = value.charAt(0).toLowerCase();
			// if no lookup array for this character exists, look it up now
			if( !stMatchSets[firstChar] ) 
				stMatchSets[firstChar] = [];

			// if the match is a string
			var row = {
				value: value,
				data: rawValue,
				result: options.formatResult && options.formatResult(rawValue) || value
			};
			
			// push the current match into the set list
			stMatchSets[firstChar].push(row);

			// keep track of minChars zero items
			if ( nullData++ < options.max ) {
				stMatchSets[""].push(row);
			}
		};

		// add the data items to the cache
		$.each(stMatchSets, function(i, value) {
			// increase the cache size
			options.cacheLength++;
			// add to the cache
			add(i, value);
		});
	}
	
	// populate any existing data
	setTimeout(populate, 25);
	
	function flush(){
		data = {};
		length = 0;
	}
	
	return {
		flush: flush,
		add: add,
		populate: populate,
		load: function(q) {
			if (!options.cacheLength || !length)
				return null;
			/* 
			 * if dealing w/local data and matchContains than we must make sure
			 * to loop through all the data collections looking for matches
			 */
			if( !options.url && options.matchContains ){
				// track all matches
				var csub = [];
				// loop through all the data grids for matches
				for( var k in data ){
					// don't search through the stMatchSets[""] (minChars: 0) cache
					// this prevents duplicates
					if( k.length > 0 ){
						var c = data[k];
						$.each(c, function(i, x) {
							// if we've got a match, add it to the array
							if (matchSubset(x.value, q)) {
								csub.push(x);
							}
						});
					}
				}				
				return csub;
			} else 
			// if the exact item exists, use it
			if (data[q]){
				return data[q];
			} else
			if (options.matchSubset) {
				for (var i = q.length - 1; i >= options.minChars; i--) {
					var c = data[q.substr(0, i)];
					if (c) {
						var csub = [];
						$.each(c, function(i, x) {
							if (matchSubset(x.value, q)) {
								csub[csub.length] = x;
							}
						});
						return csub;
					}
				}
			}
			return null;
		}
	};
};

$.Autocompleter.Select = function (options, input, select, config) {
	var CLASSES = {
		ACTIVE: "ac_over"
	};
	
	var listItems,
		active = -1,
		data,
		term = "",
		needsInit = true,
		element,
		list;
	
	// Create results
	function init() {
		if (!needsInit)
			return;
		element = $("<div/>")
		.hide()
		.addClass(options.resultsClass)
		.css("position", "absolute")
		.appendTo(document.body);
	
		list = $("<ul/>").appendTo(element).mouseover( function(event) {
			if(target(event).nodeName && target(event).nodeName.toUpperCase() == 'LI') {
	            active = $("li", list).removeClass(CLASSES.ACTIVE).index(target(event));
			    $(target(event)).addClass(CLASSES.ACTIVE);            
	        }
		}).click(function(event) {
			$(target(event)).addClass(CLASSES.ACTIVE);
			select();
			// TODO provide option to avoid setting focus again after selection? useful for cleanup-on-focus
			input.focus();
			return false;
		}).mousedown(function() {
			config.mouseDownOnSelect = true;
		}).mouseup(function() {
			config.mouseDownOnSelect = false;
		});
		
		if( options.width > 0 )
			element.css("width", options.width);
			
		needsInit = false;
	} 
	
	function target(event) {
		var element = event.target;
		while(element && element.tagName != "LI")
			element = element.parentNode;
		// more fun with IE, sometimes event.target is empty, just ignore it then
		if(!element)
			return [];
		return element;
	}

	function moveSelect(step) {
		listItems.slice(active, active + 1).removeClass(CLASSES.ACTIVE);
		movePosition(step);
        var activeItem = listItems.slice(active, active + 1).addClass(CLASSES.ACTIVE);
        if(options.scroll) {
            var offset = 0;
            listItems.slice(0, active).each(function() {
				offset += this.offsetHeight;
			});
            if((offset + activeItem[0].offsetHeight - list.scrollTop()) > list[0].clientHeight) {
                list.scrollTop(offset + activeItem[0].offsetHeight - list.innerHeight());
            } else if(offset < list.scrollTop()) {
                list.scrollTop(offset);
            }
        }
	};
	
	function movePosition(step) {
		active += step;
		if (active < 0) {
			active = listItems.size() - 1;
		} else if (active >= listItems.size()) {
			active = 0;
		}
	}
	
	function limitNumberOfItems(available) {
		return options.max && options.max < available
			? options.max
			: available;
	}
	
	function fillList() {
		list.empty();
		var max = limitNumberOfItems(data.length);
		for (var i=0; i < max; i++) {
			if (!data[i])
				continue;
			var formatted = options.formatItem(data[i].data, i+1, max, data[i].value, term);
			if ( formatted === false )
				continue;
			var li = $("<li/>").html( options.highlight(formatted, term) ).addClass(i%2 == 0 ? "ac_even" : "ac_odd").appendTo(list)[0];
			$.data(li, "ac_data", data[i]);
		}
		listItems = list.find("li");
		if ( options.selectFirst ) {
			listItems.slice(0, 1).addClass(CLASSES.ACTIVE);
			active = 0;
		}
		// apply bgiframe if available
		if ( $.fn.bgiframe )
			list.bgiframe();
	}
	
	return {
		display: function(d, q) {
			init();
			data = d;
			term = q;
			fillList();
		},
		next: function() {
			moveSelect(1);
		},
		prev: function() {
			moveSelect(-1);
		},
		pageUp: function() {
			if (active != 0 && active - 8 < 0) {
				moveSelect( -active );
			} else {
				moveSelect(-8);
			}
		},
		pageDown: function() {
			if (active != listItems.size() - 1 && active + 8 > listItems.size()) {
				moveSelect( listItems.size() - 1 - active );
			} else {
				moveSelect(8);
			}
		},
		hide: function() {
			element && element.hide();
			listItems && listItems.removeClass(CLASSES.ACTIVE);
			active = -1;
		},
		visible : function() {
			return element && element.is(":visible");
		},
		current: function() {
			return this.visible() && (listItems.filter("." + CLASSES.ACTIVE)[0] || options.selectFirst && listItems[0]);
		},
		show: function() {
			var offset = $(input).offset();
			element.css({
				width: typeof options.width == "string" || options.width > 0 ? options.width : $(input).width(),
				top: offset.top + input.offsetHeight,
				left: offset.left
			}).show();
            if(options.scroll) {
                list.scrollTop(0);
                list.css({
					maxHeight: options.scrollHeight,
					overflow: 'auto'
				});
				
                if($.browser.msie && typeof document.body.style.maxHeight === "undefined") {
					var listHeight = 0;
					listItems.each(function() {
						listHeight += this.offsetHeight;
					});
					var scrollbarsVisible = listHeight > options.scrollHeight;
                    list.css('height', scrollbarsVisible ? options.scrollHeight : listHeight );
					if (!scrollbarsVisible) {
						// IE doesn't recalculate width when scrollbar disappears
						listItems.width( list.width() - parseInt(listItems.css("padding-left")) - parseInt(listItems.css("padding-right")) );
					}
                }
                
            }
		},
		selected: function() {
			var selected = listItems && listItems.filter("." + CLASSES.ACTIVE).removeClass(CLASSES.ACTIVE);
			return selected && selected.length && $.data(selected[0], "ac_data");
		},
		emptyList: function (){
			list && list.empty();
		},
		unbind: function() {
			element && element.remove();
		}
	};
};

$.fn.selection = function(start, end) {
	if (start !== undefined) {
		return this.each(function() {
			if( this.createTextRange ){
				var selRange = this.createTextRange();
				if (end === undefined || start == end) {
					selRange.move("character", start);
					selRange.select();
				} else {
					selRange.collapse(true);
					selRange.moveStart("character", start);
					selRange.moveEnd("character", end);
					selRange.select();
				}
			} else if( this.setSelectionRange ){
				this.setSelectionRange(start, end);
			} else if( this.selectionStart ){
				this.selectionStart = start;
				this.selectionEnd = end;
			}
		});
	}
	var field = this[0];
	if ( field.createTextRange ) {
		var range = document.selection.createRange(),
			orig = field.value,
			teststring = "<->",
			textLength = range.text.length;
		range.text = teststring;
		var caretAt = field.value.indexOf(teststring);
		field.value = orig;
		this.selection(caretAt, caretAt + textLength);
		return {
			start: caretAt,
			end: caretAt + textLength
		}
	} else if( field.selectionStart !== undefined ){
		return {
			start: field.selectionStart,
			end: field.selectionEnd
		}
	}
};

})(jQuery);
;

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
(function($) {
  Drupal.behaviors.custom_search = {
    attach: function(context) {

      if (!Drupal.settings.custom_search.solr) {
        // Check if the search box is not empty on submit
        $('form.search-form', context).submit(function(){
          var $this = $(this);
          var box = $this.find('input.custom-search-box');
          if (box.val() != undefined && box.val() == '') {
            $this.find('input.custom-search-box').addClass('error');
            return false;
          }
          // If basic search is hidden, copy or value to the keys
          if ($this.find('#edit-keys').parents('div.element-invisible').attr('class') == 'element-invisible') {
            $this.find('#edit-keys').val($this.find('#edit-or').val());
            $this.find('#edit-or').val('');
          }
          return true;
        });
      }

      // Search from target
      $('form.search-form').attr('target', Drupal.settings.custom_search.form_target);

      // Displays Popup.
      $('form.search-form input.custom-search-box', context).bind('click focus', function(e){
        var $parentForm = $(this).parents('form');
        // check if there's something in the popup and displays it
        var popup = $parentForm.find('fieldset.custom_search-popup');
        if (popup.find('input,select').length && !popup.hasClass('opened')) {
          popup.fadeIn().addClass('opened');
        }
        e.stopPropagation();
      });
      $(document).bind('click focus', function(){
        $('fieldset.custom_search-popup').hide().removeClass('opened');
      });

      // Handle checkboxes
      $('.custom-search-selector input:checkbox', context).each(function(){
        var el = $(this);
        if (el.val() == 'c-all') {
          el.change(function(){
            $(this).parents('.custom-search-selector').find('input:checkbox[value!=c-all]').attr('checked', false);
          });
        }
        else {
          if (el.val().substr(0,2) == 'c-') {
            el.change(function(){
              $('.custom-search-selector input:checkbox').each(function(){
                if ($(this).val().substr(0,2) == 'o-') {
                  $(this).attr('checked', false);
                }
              });
              $(this).parents('.custom-search-selector').find('input:checkbox[value=c-all]').attr('checked', false);
            });
          } else {
            el.change(function(){
              $(this).parents('.custom-search-selector').find('input:checkbox[value!=' + el.val() + ']').attr('checked', false);
            });
          }
        }
      });

      // Reselect types and terms in advanced search
      var edit_keys = encodeURIComponent($('#edit-keys').val());

      if (edit_keys) {
        // types
        var pos = edit_keys.indexOf('type:');
        if (pos != -1) {
          var pos2 = edit_keys.indexOf(' ', pos);
          if (pos2 == -1) {
            pos2 = edit_keys.length;
          }
          var types = edit_keys.substring(pos + 5,pos2);
          types = types.split(',');
          for (var i = 0; i < types.length; i++) {
            $('.search-form input:checkbox[value=' + types[i] + ']').attr('checked', true);
          }
        }
        // terms
        var pos = edit_keys.indexOf('term:');
        if (pos != -1) {
          var pos2 = edit_keys.indexOf(' ', pos);
          if (pos2 == -1) {
            pos2 = edit_keys.length;
          }
          var terms = edit_keys.substring(pos + 5, pos2);
          terms = terms.split(',');
          for (var i = 0; i < terms.length; i++) {
            $('#edit-term option[value=' + terms[i] + ']').attr('selected', true);
          }
        }
        // languages
        var pos = edit_keys.indexOf('language:');
        if (pos != -1) {
          var pos2 = edit_keys.indexOf(' ', pos);
          if (pos2 == -1) {
            pos2 = edit_keys.length;
          }
          var languages = edit_keys.substring(pos + 9,pos2);
          languages = languages.split(',');
          for (var i = 0; i < languages.length; i++) {
            $('.search-advanced #edit-language-' + languages[i]).attr('checked', true);
          }
        }
      }

      var popup = $('fieldset.custom_search-popup:not(.custom_search-processed)', context).addClass("custom_search-processed");
      popup.click(function(e){
        e.stopPropagation();
      })
      popup.append('<a class="custom_search-popup-close" href="#">' + Drupal.t('Close') + '</a>');
      $('a.custom_search-popup-close').click(function(e){
        $('fieldset.custom_search-popup.opened').hide().removeClass('opened');
        e.preventDefault();
      });

    }
  }
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
  this.element = $('<div class="progress" aria-live="polite"></div>').attr('id', id);
  this.element.html('<div class="bar"><div class="filled"></div></div>' +
                    '<div class="percentage"></div>' +
                    '<div class="message">&nbsp;</div>');
};

/**
 * Set the percentage and status message for the progressbar.
 */
Drupal.progressBar.prototype.setProgress = function (percentage, message) {
  if (percentage >= 0 && percentage <= 100) {
    $('div.filled', this.element).css('width', percentage + '%');
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
  var error = $('<div class="messages error"></div>').html(string);
  $(this.element).before(error).hide();

  if (this.errorCallback) {
    this.errorCallback(this);
  }
};

})(jQuery);
;
/**
 * @file
 *
 * Implement a modal form.
 *
 * @see modal.inc for documentation.
 *
 * This javascript relies on the CTools ajax responder.
 */

(function ($) {
  // Make sure our objects are defined.
  Drupal.CTools = Drupal.CTools || {};
  Drupal.CTools.Modal = Drupal.CTools.Modal || {};

  /**
   * Display the modal
   *
   * @todo -- document the settings.
   */
  Drupal.CTools.Modal.show = function(choice) {
    var opts = {};

    if (choice && typeof choice == 'string' && Drupal.settings[choice]) {
      // This notation guarantees we are actually copying it.
      $.extend(true, opts, Drupal.settings[choice]);
    }
    else if (choice) {
      $.extend(true, opts, choice);
    }

    var defaults = {
      modalTheme: 'CToolsModalDialog',
      throbberTheme: 'CToolsModalThrobber',
      animation: 'show',
      animationSpeed: 'fast',
      modalSize: {
        type: 'scale',
        width: .8,
        height: .8,
        addWidth: 0,
        addHeight: 0,
        // How much to remove from the inner content to make space for the
        // theming.
        contentRight: 25,
        contentBottom: 45
      },
      modalOptions: {
        opacity: .55,
        background: '#fff'
      }
    };

    var settings = {};
    $.extend(true, settings, defaults, Drupal.settings.CToolsModal, opts);

    if (Drupal.CTools.Modal.currentSettings && Drupal.CTools.Modal.currentSettings != settings) {
      Drupal.CTools.Modal.modal.remove();
      Drupal.CTools.Modal.modal = null;
    }

    Drupal.CTools.Modal.currentSettings = settings;

    var resize = function(e) {
      // When creating the modal, it actually exists only in a theoretical
      // place that is not in the DOM. But once the modal exists, it is in the
      // DOM so the context must be set appropriately.
      var context = e ? document : Drupal.CTools.Modal.modal;

      if (Drupal.CTools.Modal.currentSettings.modalSize.type == 'scale') {
        var width = $(window).width() * Drupal.CTools.Modal.currentSettings.modalSize.width;
        var height = $(window).height() * Drupal.CTools.Modal.currentSettings.modalSize.height;
      }
      else {
        var width = Drupal.CTools.Modal.currentSettings.modalSize.width;
        var height = Drupal.CTools.Modal.currentSettings.modalSize.height;
      }

      // Use the additionol pixels for creating the width and height.
      $('div.ctools-modal-content', context).css({
        'width': width + Drupal.CTools.Modal.currentSettings.modalSize.addWidth + 'px',
        'height': height + Drupal.CTools.Modal.currentSettings.modalSize.addHeight + 'px'
      });
      $('div.ctools-modal-content .modal-content', context).css({
        'width': (width - Drupal.CTools.Modal.currentSettings.modalSize.contentRight) + 'px',
        'height': (height - Drupal.CTools.Modal.currentSettings.modalSize.contentBottom) + 'px'
      });
    }

    if (!Drupal.CTools.Modal.modal) {
      Drupal.CTools.Modal.modal = $(Drupal.theme(settings.modalTheme));
      if (settings.modalSize.type == 'scale') {
        $(window).bind('resize', resize);
      }
    }

    resize();

    $('span.modal-title', Drupal.CTools.Modal.modal).html(Drupal.CTools.Modal.currentSettings.loadingText);
    Drupal.CTools.Modal.modalContent(Drupal.CTools.Modal.modal, settings.modalOptions, settings.animation, settings.animationSpeed);
    $('#modalContent .modal-content').html(Drupal.theme(settings.throbberTheme));
  };

  /**
   * Hide the modal
   */
  Drupal.CTools.Modal.dismiss = function() {
    if (Drupal.CTools.Modal.modal) {
      Drupal.CTools.Modal.unmodalContent(Drupal.CTools.Modal.modal);
    }
  };

  /**
   * Provide the HTML to create the modal dialog.
   */
  Drupal.theme.prototype.CToolsModalDialog = function () {
    var html = ''
    html += '  <div id="ctools-modal">'
    html += '    <div class="ctools-modal-content">' // panels-modal-content
    html += '      <div class="modal-header">';
    html += '        <a class="close" href="#">';
    html +=            Drupal.CTools.Modal.currentSettings.closeText + Drupal.CTools.Modal.currentSettings.closeImage;
    html += '        </a>';
    html += '        <span id="modal-title" class="modal-title">&nbsp;</span>';
    html += '      </div>';
    html += '      <div id="modal-content" class="modal-content">';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';

    return html;
  }

  /**
   * Provide the HTML to create the throbber.
   */
  Drupal.theme.prototype.CToolsModalThrobber = function () {
    var html = '';
    html += '  <div id="modal-throbber">';
    html += '    <div class="modal-throbber-wrapper">';
    html +=        Drupal.CTools.Modal.currentSettings.throbber;
    html += '    </div>';
    html += '  </div>';

    return html;
  };

  /**
   * Figure out what settings string to use to display a modal.
   */
  Drupal.CTools.Modal.getSettings = function (object) {
    var match = $(object).attr('class').match(/ctools-modal-(\S+)/);
    if (match) {
      return match[1];
    }
  }

  /**
   * Click function for modals that can be cached.
   */
  Drupal.CTools.Modal.clickAjaxCacheLink = function () {
    Drupal.CTools.Modal.show(Drupal.CTools.Modal.getSettings(this));
    return Drupal.CTools.AJAX.clickAJAXCacheLink.apply(this);
  };

  /**
   * Handler to prepare the modal for the response
   */
  Drupal.CTools.Modal.clickAjaxLink = function () {
    Drupal.CTools.Modal.show(Drupal.CTools.Modal.getSettings(this));
    return false;
  };

  /**
   * Submit responder to do an AJAX submit on all modal forms.
   */
  Drupal.CTools.Modal.submitAjaxForm = function(e) {
    var $form = $(this);
    var url = $form.attr('action');

    setTimeout(function() { Drupal.CTools.AJAX.ajaxSubmit($form, url); }, 1);
    return false;
  }

  /**
   * Bind links that will open modals to the appropriate function.
   */
  Drupal.behaviors.ZZCToolsModal = {
    attach: function(context) {
      // Bind links
      // Note that doing so in this order means that the two classes can be
      // used together safely.
      /*
       * @todo remimplement the warm caching feature
       $('a.ctools-use-modal-cache', context).once('ctools-use-modal', function() {
         $(this).click(Drupal.CTools.Modal.clickAjaxCacheLink);
         Drupal.CTools.AJAX.warmCache.apply(this);
       });
        */

      $('area.ctools-use-modal, a.ctools-use-modal', context).once('ctools-use-modal', function() {
        var $this = $(this);
        $this.click(Drupal.CTools.Modal.clickAjaxLink);
        // Create a drupal ajax object
        var element_settings = {};
        if ($this.attr('href')) {
          element_settings.url = $this.attr('href');
          element_settings.event = 'click';
          element_settings.progress = { type: 'throbber' };
        }
        var base = $this.attr('href');
        Drupal.ajax[base] = new Drupal.ajax(base, this, element_settings);
      });

      // Bind buttons
      $('input.ctools-use-modal, button.ctools-use-modal', context).once('ctools-use-modal', function() {
        var $this = $(this);
        $this.click(Drupal.CTools.Modal.clickAjaxLink);
        var button = this;
        var element_settings = {};

        // AJAX submits specified in this manner automatically submit to the
        // normal form action.
        element_settings.url = Drupal.CTools.Modal.findURL(this);
        element_settings.event = 'click';

        var base = $this.attr('id');
        Drupal.ajax[base] = new Drupal.ajax(base, this, element_settings);

        // Make sure changes to settings are reflected in the URL.
        $('.' + $(button).attr('id') + '-url').change(function() {
          Drupal.ajax[base].options.url = Drupal.CTools.Modal.findURL(button);
        });
      });

      // Bind our custom event to the form submit
      $('#modal-content form', context).once('ctools-use-modal', function() {
        var $this = $(this);
        var element_settings = {};

        element_settings.url = $this.attr('action');
        element_settings.event = 'submit';
        element_settings.progress = { 'type': 'throbber' }
        var base = $this.attr('id');

        Drupal.ajax[base] = new Drupal.ajax(base, this, element_settings);
        Drupal.ajax[base].form = $this;

        $('input[type=submit], button', this).click(function(event) {
          Drupal.ajax[base].element = this;
          this.form.clk = this;
          // An empty event means we were triggered via .click() and
          // in jquery 1.4 this won't trigger a submit.
          if (event.bubbles == undefined) {
            $(this.form).trigger('submit');
            return false;
          }
        });
      });

      // Bind a click handler to allow elements with the 'ctools-close-modal'
      // class to close the modal.
      $('.ctools-close-modal', context).once('ctools-close-modal')
        .click(function() {
          Drupal.CTools.Modal.dismiss();
          return false;
        });
    }
  };

  // The following are implementations of AJAX responder commands.

  /**
   * AJAX responder command to place HTML within the modal.
   */
  Drupal.CTools.Modal.modal_display = function(ajax, response, status) {
    if ($('#modalContent').length == 0) {
      Drupal.CTools.Modal.show(Drupal.CTools.Modal.getSettings(ajax.element));
    }
    $('#modal-title').html(response.title);
    // Simulate an actual page load by scrolling to the top after adding the
    // content. This is helpful for allowing users to see error messages at the
    // top of a form, etc.
    $('#modal-content').html(response.output).scrollTop(0);
    Drupal.attachBehaviors();
  }

  /**
   * AJAX responder command to dismiss the modal.
   */
  Drupal.CTools.Modal.modal_dismiss = function(command) {
    Drupal.CTools.Modal.dismiss();
    $('link.ctools-temporary-css').remove();
  }

  /**
   * Display loading
   */
  //Drupal.CTools.AJAX.commands.modal_loading = function(command) {
  Drupal.CTools.Modal.modal_loading = function(command) {
    Drupal.CTools.Modal.modal_display({
      output: Drupal.theme(Drupal.CTools.Modal.currentSettings.throbberTheme),
      title: Drupal.CTools.Modal.currentSettings.loadingText
    });
  }

  /**
   * Find a URL for an AJAX button.
   *
   * The URL for this gadget will be composed of the values of items by
   * taking the ID of this item and adding -url and looking for that
   * class. They need to be in the form in order since we will
   * concat them all together using '/'.
   */
  Drupal.CTools.Modal.findURL = function(item) {
    var url = '';
    var url_class = '.' + $(item).attr('id') + '-url';
    $(url_class).each(
      function() {
        var $this = $(this);
        if (url && $this.val()) {
          url += '/';
        }
        url += $this.val();
      });
    return url;
  };


  /**
   * modalContent
   * @param content string to display in the content box
   * @param css obj of css attributes
   * @param animation (fadeIn, slideDown, show)
   * @param speed (valid animation speeds slow, medium, fast or # in ms)
   */
  Drupal.CTools.Modal.modalContent = function(content, css, animation, speed) {
    // If our animation isn't set, make it just show/pop
    if (!animation) {
      animation = 'show';
    }
    else {
      // If our animation isn't "fadeIn" or "slideDown" then it always is show
      if (animation != 'fadeIn' && animation != 'slideDown') {
        animation = 'show';
      }
    }

    if (!speed) {
      speed = 'fast';
    }

    // Build our base attributes and allow them to be overriden
    css = jQuery.extend({
      position: 'absolute',
      left: '0px',
      margin: '0px',
      background: '#000',
      opacity: '.55'
    }, css);

    // Add opacity handling for IE.
    css.filter = 'alpha(opacity=' + (100 * css.opacity) + ')';
    content.hide();

    // if we already ahve a modalContent, remove it
    if ( $('#modalBackdrop')) $('#modalBackdrop').remove();
    if ( $('#modalContent')) $('#modalContent').remove();

    // position code lifted from http://www.quirksmode.org/viewport/compatibility.html
    if (self.pageYOffset) { // all except Explorer
    var wt = self.pageYOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) { // Explorer 6 Strict
      var wt = document.documentElement.scrollTop;
    } else if (document.body) { // all other Explorers
      var wt = document.body.scrollTop;
    }

    // Get our dimensions

    // Get the docHeight and (ugly hack) add 50 pixels to make sure we dont have a *visible* border below our div
    var docHeight = $(document).height() + 50;
    var docWidth = $(document).width();
    var winHeight = $(window).height();
    var winWidth = $(window).width();
    if( docHeight < winHeight ) docHeight = winHeight;

    // Create our divs
    $('body').append('<div id="modalBackdrop" style="z-index: 1000; display: none;"></div><div id="modalContent" style="z-index: 1001; position: absolute;">' + $(content).html() + '</div>');

    // Keyboard and focus event handler ensures focus stays on modal elements only
    modalEventHandler = function( event ) {
      target = null;
      if ( event ) { //Mozilla
        target = event.target;
      } else { //IE
        event = window.event;
        target = event.srcElement;
      }

      var parents = $(target).parents().get();
      for (var i = 0; i < parents.length; ++i) {
        var position = $(parents[i]).css('position');
        if (position == 'absolute' || position == 'fixed') {
          return true;
        }
      }
      if( $(target).filter('*:visible').parents('#modalContent').size()) {
        // allow the event only if target is a visible child node of #modalContent
        return true;
      }
      if ( $('#modalContent')) $('#modalContent').get(0).focus();
      return false;
    };
    $('body').bind( 'focus', modalEventHandler );
    $('body').bind( 'keypress', modalEventHandler );

    // Create our content div, get the dimensions, and hide it
    var modalContent = $('#modalContent').css('top','-1000px');
    var mdcTop = wt + ( winHeight / 2 ) - (  modalContent.outerHeight() / 2);
    var mdcLeft = ( winWidth / 2 ) - ( modalContent.outerWidth() / 2);
    $('#modalBackdrop').css(css).css('top', 0).css('height', docHeight + 'px').css('width', docWidth + 'px').show();
    modalContent.css({top: mdcTop + 'px', left: mdcLeft + 'px'}).hide()[animation](speed);

    // Bind a click for closing the modalContent
    modalContentClose = function(){close(); return false;};
    $('.close').bind('click', modalContentClose);

    // Bind a keypress on escape for closing the modalContent
    modalEventEscapeCloseHandler = function(event) {
      if (event.keyCode == 27) {
        close();
        return false;
      }
    };

    $(document).bind('keydown', modalEventEscapeCloseHandler);

    // Close the open modal content and backdrop
    function close() {
      // Unbind the events
      $(window).unbind('resize',  modalContentResize);
      $('body').unbind( 'focus', modalEventHandler);
      $('body').unbind( 'keypress', modalEventHandler );
      $('.close').unbind('click', modalContentClose);
      $('body').unbind('keypress', modalEventEscapeCloseHandler);
      $(document).trigger('CToolsDetachBehaviors', $('#modalContent'));

      // Set our animation parameters and use them
      if ( animation == 'fadeIn' ) animation = 'fadeOut';
      if ( animation == 'slideDown' ) animation = 'slideUp';
      if ( animation == 'show' ) animation = 'hide';

      // Close the content
      modalContent.hide()[animation](speed);

      // Remove the content
      $('#modalContent').remove();
      $('#modalBackdrop').remove();
    };

    // Move and resize the modalBackdrop and modalContent on resize of the window
     modalContentResize = function(){
      // Get our heights
      var docHeight = $(document).height();
      var docWidth = $(document).width();
      var winHeight = $(window).height();
      var winWidth = $(window).width();
      if( docHeight < winHeight ) docHeight = winHeight;

      // Get where we should move content to
      var modalContent = $('#modalContent');
      var mdcTop = ( winHeight / 2 ) - (  modalContent.outerHeight() / 2);
      var mdcLeft = ( winWidth / 2 ) - ( modalContent.outerWidth() / 2);

      // Apply the changes
      $('#modalBackdrop').css('height', docHeight + 'px').css('width', docWidth + 'px').show();
      modalContent.css('top', mdcTop + 'px').css('left', mdcLeft + 'px').show();
    };
    $(window).bind('resize', modalContentResize);

    $('#modalContent').focus();
  };

  /**
   * unmodalContent
   * @param content (The jQuery object to remove)
   * @param animation (fadeOut, slideUp, show)
   * @param speed (valid animation speeds slow, medium, fast or # in ms)
   */
  Drupal.CTools.Modal.unmodalContent = function(content, animation, speed)
  {
    // If our animation isn't set, make it just show/pop
    if (!animation) { var animation = 'show'; } else {
      // If our animation isn't "fade" then it always is show
      if (( animation != 'fadeOut' ) && ( animation != 'slideUp')) animation = 'show';
    }
    // Set a speed if we dont have one
    if ( !speed ) var speed = 'fast';

    // Unbind the events we bound
    $(window).unbind('resize', modalContentResize);
    $('body').unbind('focus', modalEventHandler);
    $('body').unbind('keypress', modalEventHandler);
    $('.close').unbind('click', modalContentClose);
    $(document).trigger('CToolsDetachBehaviors', $('#modalContent'));

    // jQuery magic loop through the instances and run the animations or removal.
    content.each(function(){
      if ( animation == 'fade' ) {
        $('#modalContent').fadeOut(speed, function() {
          $('#modalBackdrop').fadeOut(speed, function() {
            $(this).remove();
          });
          $(this).remove();
        });
      } else {
        if ( animation == 'slide' ) {
          $('#modalContent').slideUp(speed,function() {
            $('#modalBackdrop').slideUp(speed, function() {
              $(this).remove();
            });
            $(this).remove();
          });
        } else {
          $('#modalContent').remove();
          $('#modalBackdrop').remove();
        }
      }
    });
  };

$(function() {
  Drupal.ajax.prototype.commands.modal_display = Drupal.CTools.Modal.modal_display;
  Drupal.ajax.prototype.commands.modal_dismiss = Drupal.CTools.Modal.modal_dismiss;
});

})(jQuery);
;
/**
 * @file
 * Implement basic methods required by all of panels.
 */

(function ($) {
  Drupal.Panels = Drupal.Panels || {};

  Drupal.Panels.changed = function(item) {
    if (!item.is('.changed')) {
      item.addClass('changed');
      item.find('div.grabber span.text').append(' <span class="star">*</span> ');
    }
  };

  Drupal.Panels.restripeTable = function(table) {
    // :even and :odd are reversed because jquery counts from 0 and
    // we count from 1, so we're out of sync.
    $('tbody tr:not(:hidden)', $(table))
      .removeClass('even')
      .removeClass('odd')
      .filter(':even')
        .addClass('odd')
      .end()
      .filter(':odd')
        .addClass('even');
  };
})(jQuery);
;
/**
 * @file display_editor.js
 *
 * Contains the javascript for the Panels display editor.
 */

(function ($) {

// randomly lock a pane.
// @debug only
Drupal.settings.Panels = Drupal.settings.Panels || {};


/** Delete pane button **/
Drupal.Panels.bindClickDelete = function(context) {
  $('a.pane-delete:not(.pane-delete-processed)', context)
    .addClass('pane-delete-processed')
    .click(function() {
    if (confirm('Remove this pane?')) {
      var id = '#' + $(this).attr('id').replace('pane-delete-', '');
      $(id).remove();
      Drupal.Panels.Draggable.savePositions();
    }
    return false;
  });
};

Drupal.Panels.bindPortlet = function() {
  var handle = $(this).find('.panel-pane-collapsible > div.pane-title');
  var content = $(this).find('.panel-pane-collapsible > div.pane-content');
  if (content.length) {
    var toggle = $('<span class="toggle toggle-collapsed"></span>');
    handle.before(toggle);
    toggle.click(function() {
      content.slideToggle(20);
      toggle.toggleClass('toggle-collapsed');
    });
    handle.click(function() {
      content.slideToggle(20);
      toggle.toggleClass('toggle-collapsed');
    });
    content.hide();
  }
};

Drupal.Panels.Draggable = {
  // The draggable object
  object: null,

  // Where objects can be dropped
  dropzones: [],
  current_dropzone: null,

  // positions within dropzones where an object can be plazed
  landing_pads: [],
  current_pad: null,

  // Where the object is
  mouseOffset: { x: 0, y: 0 },
  windowOffset: { x: 0, y: 0 },
  offsetDivHeight: 0,

  // original settings to be restored
  original: {},
  // a placeholder so that if the object is let go but not over a drop zone,
  // it can be put back where it belongs
  placeholder: {},

  hoverclass: 'hoverclass',
  helperclass: 'helperclass',
  accept: 'div.panel-region',
  handle: 'div.grabber',
  draggable: 'div.panel-portlet',
  main: 'div#panels-dnd-main',

  // part of the id to remove to get just the number
  draggableId: 'panel-pane-',

  // part of the id to remove to get just the number
  regionId: 'panel-region-',

  // What to add to the front of a the id to get the form id for a panel
  formId: 'input#edit-',

  maxWidth: 250,

  unsetDropZone: function() {
    $(this.current_dropzone.obj).removeClass(this.hoverclass);
    this.current_dropzone = null;
    for (var i in this.landing_pads) {
      $(this.landing_pads[i].obj).remove();
    }
    this.landing_pads = [];
    this.current_pad = null;
  },

  createLandingPad: function(where, append) {
    var obj = $('<div class="' + this.helperclass +'" id="' +
      $(where).attr('id') + '-dropzone">&nbsp;</div>');
    if (append) {
      $(where).append(obj);
    }
    else {
      $(where).before(obj);
    }
    var offset = $(obj).offset();

    $(obj).css({
      display: 'none'
    });
    this.landing_pads.push({
      centerX: offset.left + ($(obj).innerWidth() / 2),
      centerY: offset.top + ($(obj).innerHeight() / 2),
      obj: obj
    });
    return obj;
  },

  calculateDropZones: function(event, dropzone) {
    var draggable = Drupal.Panels.Draggable;
    var dropzones = [];
    $(this.accept).each(function() {
      var offset = $(this).offset();
      offset.obj = this;
      offset.region = this.id.replace(draggable.regionId, '');
      offset.width = $(this).outerWidth();
      offset.height = $(this).outerHeight();
      dropzones.push(offset);
    });
    this.dropzones = dropzones;
  },

  reCalculateDropZones: function() {
    for (var i in this.dropzones) {
      var offset = $(this.dropzones[i].obj).offset();
      offset.width = $(this.dropzones[i].obj).outerWidth();
      offset.height = $(this.dropzones[i].obj).outerHeight();
      $.extend(this.dropzones[i], offset);
    }
  },

  changeDropZone: function(new_dropzone) {
    // Unset our old dropzone.
    if (this.current_dropzone) {
      this.unsetDropZone();
    }

    // Set up our new dropzone.
    this.current_dropzone = new_dropzone;
    $(this.current_dropzone.obj).addClass(this.hoverclass);
    // add a landing pad
    this.createLandingPad(this.current_dropzone.obj, true);

    var that = this;
    // Create a landing pad before each existing portlet.
    $(this.current_dropzone.obj).find(this.draggable).each(function() {
      if (that.object.id != this.id) {
        that.createLandingPad(this, false);
      }
    });
  },

  findLandingPad: function(x, y) {
    var shortest_distance = null;
    var nearest_pad = null;
    // find the nearest pad.
    for (var i in this.landing_pads) {
      // This isn't the real distance, this is the square of the
      // distance -- no point in spending processing time on
      // sqrt.
      var dstx = Math.abs(x - this.landing_pads[i].centerX);
      var dsty = Math.abs(y - this.landing_pads[i].centerY);
      var distance =  (dstx * dstx) + (dsty * dsty);
      if (shortest_distance == null || distance < shortest_distance) {
        shortest_distance = distance;
        nearest_pad = this.landing_pads[i];
      }
    }
    if (nearest_pad != this.current_pad) {
      if (this.current_pad) {
        $(this.current_pad.obj).hide();
      }
      this.current_pad = nearest_pad;
      $(nearest_pad.obj).show();
    }
  },

  findDropZone: function(x, y) {
    // Go through our dropzones and see if we're over one.
    var new_dropzone = null;
    for (var i in this.dropzones) {
//      console.log('x:' + x + ' left:' + this.dropzones[i].left + ' right: ' + this.dropzones[i].left + this.dropzones[i].width);
      if (this.dropzones[i].left < x &&
        x < this.dropzones[i].left + this.dropzones[i].width &&
        this.dropzones[i].top < y &&
        y < this.dropzones[i].top + this.dropzones[i].height) {
          new_dropzone = this.dropzones[i];
          break;
      }
    }
    // If we're over one, see if it's different.
    if (new_dropzone && (!this.regionLock || this.regionLockRegions[new_dropzone.region])) {
      var changed = false;
      if (!this.current_dropzone || new_dropzone.obj.id != this.current_dropzone.obj.id) {
        this.changeDropZone(new_dropzone);
        changed = true;
      }
      this.findLandingPad(x, y);
      if (changed)  {
        // recalculate the size of our drop zones due to the fact that we're drawing landing pads.
        this.reCalculateDropZones();
      }
    }
    // If we're not over one, be sure to unhilite one if we were just
    // over it.
    else if (this.current_dropzone) {
      this.unsetDropZone();
    }
  },

  /** save button clicked, or pane deleted **/
  savePositions: function() {
    var draggable = Drupal.Panels.Draggable;
    $(draggable.accept).each(function() {
      var val = '';
      $(this).find(draggable.draggable).each(function() {
        if (val) {
          val += ',';
        }

        val += this.id.replace(draggable.draggableId, '');
      });
      var region = this.id.replace(draggable.regionId, '');
      $('input[name="panel[pane][' +  region + ']"]').val(val);
    });
    return false;
  }
};

Drupal.Panels.DraggableHandler = function() {
  $(this).addClass('panel-draggable');
  var draggable = Drupal.Panels.Draggable;
  var scrollBuffer = 10;
  var scrollDistance = 10;
  var scrollTimer = 30;

  getMouseOffset = function(docPos, mousePos, windowPos) {
    return { x: mousePos.x - docPos.x + windowPos.x, y: mousePos.y - docPos.y + windowPos.y};
  };

  getMousePos = function(ev) {
    ev = ev || window.event;

    if (ev.pageX || ev.pageY) {
      return { x:ev.pageX, y:ev.pageY };
    }
    return {
      x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
      y:ev.clientY + document.body.scrollTop  - document.body.clientTop
    };
  };

  getPosition = function(e) {
    /*
    if (document.defaultView && document.defaultView.getComputedStyle) {
      var css = document.defaultView.getComputedStyle(e, null);
      return {
        x: parseInt(css.getPropertyValue('left')),
        y: parseInt(css.getPropertyValue('top'))
      };
    }
    */
    var left = 0;
    var top  = 0;

    while (e.offsetParent) {
      left += e.offsetLeft;
      top  += e.offsetTop;
      e     = e.offsetParent;
    }

    left += e.offsetLeft;
    top  += e.offsetTop;

    return { x:left, y:top };
  };

  mouseUp = function(e) {
    clearTimeout(draggable.timeoutId);
    draggable.dropzones = [];

    if (draggable.current_pad) {
      // Drop the object where we're hovering
      $(draggable.object).insertAfter($(draggable.current_pad.obj));
      Drupal.Panels.changed($(draggable.object));
    }
    else {
      // or put it back where it came from
      $(draggable.object).insertAfter(draggable.placeholder);
    }
    // remove the placeholder
    draggable.placeholder.remove();

    // restore original settings.
    $(draggable.object).css(draggable.original);
    if (draggable.current_dropzone) {
      draggable.unsetDropZone();
    }

    $(document).unbind('mouseup').unbind('mousemove');
    draggable.savePositions();
  };

  mouseMove = function(e) {
    draggable.mousePos = getMousePos(e);

    draggable.findDropZone(draggable.mousePos.x, draggable.mousePos.y);

    var windowMoved = parseInt(draggable.offsetDivHeight - $(draggable.main).innerHeight());

    draggable.object.style.top = draggable.mousePos.y - draggable.mouseOffset.y + windowMoved + 'px';
    draggable.object.style.left = draggable.mousePos.x - draggable.mouseOffset.x  + 'px';
    $(draggable.object).toggleClass('moving');
  };

  mouseDown = function(e) {
    // If we mouse-downed over something clickable, don't drag!
    if (e.target.nodeName == 'A' || e.target.nodeName == 'INPUT' || e.target.parentNode.nodeName == 'A' || e.target.nodeName.nodeName == 'INPUT') {
      return;
    }

    draggable.object = $(this).parent(draggable.draggable).get(0);
    draggable.paneId = draggable.object.id.replace(draggable.draggableId, '');

    // create a placeholder so we can put this object back if dropped in an invalid location.
    draggable.placeholder = $('<div class="draggable-placeholder-object" style="display:none"></div>"');
    $(draggable.object).after(draggable.placeholder);

    // Store original CSS so we can put it back.
    draggable.original = {
      position: $(draggable.object).css('position'),
      width: 'auto',
      left: $(draggable.object).css('left'),
      top: $(draggable.object).css('top'),
      'z-index': $(draggable.object).css('z-index'),
      'margin-bottom': $(draggable.object).css('margin-bottom'),
      'margin-top': $(draggable.object).css('margin-top'),
      'margin-left': $(draggable.object).css('margin-left'),
      'margin-right': $(draggable.object).css('margin-right'),
      'padding-bottom': $(draggable.object).css('padding-bottom'),
      'padding-top': $(draggable.object).css('padding-top'),
      'padding-left': $(draggable.object).css('padding-left'),
      'padding-right': $(draggable.object).css('padding-right')
    };

    draggable.mousePos = getMousePos(e);
    var originalPos = $(draggable.object).offset();
    var width = Math.min($(draggable.object).innerWidth(), draggable.maxWidth);

    draggable.offsetDivHeight = $(draggable.main).innerHeight();
    draggable.findDropZone(draggable.mousePos.x, draggable.mousePos.y);

    // Make copies of these because in FF3, they actually change when we
    // move the item, whereas they did not in FF2.

    if (e.layerX || e.layerY) {
      var layerX = e.layerX;
      var layerY = e.layerY;
    }
    else if (e.originalEvent && e.originalEvent.layerX) {
      var layerX = e.originalEvent.layerX;
      var layerY = e.originalEvent.layerY;
    }

    // Make the draggable relative, get it out of the way and make it
    // invisible.
    $(draggable.object).css({
      position: 'relative',
      'z-index': 100,
      width: width + 'px',
      'margin-bottom': (-1 * parseInt($(draggable.object).outerHeight())) + 'px',
      'margin-top': 0,
      'margin-left': 0,
      'margin-right': (-1 * parseInt($(draggable.object).outerWidth())) + 'px',
      'padding-bottom': 0,
      'padding-top': 0,
      'padding-left': 0,
      'padding-right': 0,
      'left': 0,
      'top': 0
    })
      .insertAfter($(draggable.main));
    var newPos = $(draggable.object).offset();

    var windowOffset = { left: originalPos.left - newPos.left, top: originalPos.top - newPos.top }

    // if they grabbed outside the area where we make the draggable smaller, move it
    // closer to the cursor.
    if (layerX != 'undefined' && layerX > width) {
      windowOffset.left += layerX - 10;
    }
    else if (layerX != 'undefined' && e.offsetX > width) {
      windowOffset.left += e.offsetX - 10;
    }

    // This is stored so we can move with it.
    draggable.mouseOffset = { x: draggable.mousePos.x - windowOffset.left, y: draggable.mousePos.y - windowOffset.top};
    draggable.offsetDivHeight = $(draggable.main).innerHeight();

    draggable.object.style.top = windowOffset.top + 'px';
    draggable.object.style.left = windowOffset.left + 'px';
    $(document).unbind('mouseup').unbind('mousemove').mouseup(mouseUp).mousemove(mouseMove);

    draggable.calculateDropZones(draggable.mousePos, e);
    draggable.timeoutId = setTimeout('timer()', scrollTimer);

    // If locking to a particular set of regions, set that:
    if (Drupal.settings.Panels && Drupal.settings.Panels.RegionLock && Drupal.settings.Panels.RegionLock[draggable.paneId]) {
      draggable.regionLock = true;
      draggable.regionLockRegions = Drupal.settings.Panels.RegionLock[draggable.paneId];
    }
    else {
      draggable.regionLock = false;
      draggable.regionLockRegions = null;
    }

    return false;
  };

  timer = function() {
    if (!draggable.timeCount) {
      draggable.timeCount = 0;
    }
    draggable.timeCount = draggable.timeCount + 1;
    var left = $(window).scrollLeft();
    var right = left + $(window).width();
    var top = $(window).scrollTop();
    var bottom = top + $(window).height();

    if (draggable.mousePos.x < left + scrollBuffer && left > 0) {
      window.scrollTo(left - scrollDistance, top);
      draggable.mousePos.x -= scrollDistance;
      draggable.object.style.top = draggable.mousePos.y - draggable.mouseOffset.y + 'px';
    }
    else if (draggable.mousePos.x > right - scrollBuffer) {
      window.scrollTo(left + scrollDistance, top);
      draggable.mousePos.x += scrollDistance;
      draggable.object.style.top = draggable.mousePos.y - draggable.mouseOffset.y + 'px';
    }
    else if (draggable.mousePos.y < top + scrollBuffer && top > 0) {
      window.scrollTo(left, top - scrollDistance);
      draggable.mousePos.y -= scrollDistance;
      draggable.object.style.top = draggable.mousePos.y - draggable.mouseOffset.y + 'px';
    }
    else if (draggable.mousePos.y > bottom - scrollBuffer) {
      window.scrollTo(left, top + scrollDistance);
      draggable.mousePos.y += scrollDistance;
      draggable.object.style.top = draggable.mousePos.y - draggable.mouseOffset.y + 'px';
    }

    draggable.timeoutId = setTimeout('timer()', scrollTimer);
  }

  $(this).mousedown(mouseDown);
};

$.fn.extend({
  panelsDraggable: Drupal.Panels.DraggableHandler
});

/**
 * Implement Drupal behavior for autoattach
 */
Drupal.behaviors.PanelsDisplayEditor = {
  attach: function(context) {
    // Show javascript only items.
    $('span#panels-js-only').css('display', 'inline');

    $('#panels-dnd-main div.panel-pane:not(.panel-portlet)')
      .addClass('panel-portlet')
      .each(Drupal.Panels.bindPortlet);

    // The above doesn't work if context IS the pane, so do this to catch that.
    if ($(context).hasClass('panel-pane') && !$(context).hasClass('panel-portlet')) {
      $(context)
        .addClass('panel-portlet')
        .each(Drupal.Panels.bindPortlet);
    }

    // Make draggables and make sure their positions are saved.
    $(context).find('div.grabber:not(.panel-draggable)').panelsDraggable();
    Drupal.Panels.Draggable.savePositions();

    // Bind buttons.
    $('input#panels-hide-all', context).click(Drupal.Panels.clickHideAll);
    $('input#panels-show-all', context).click(Drupal.Panels.clickShowAll);

    Drupal.Panels.bindClickDelete(context);

    $('#panels-live-preview-button:not(.panels-preview-processed)')
      .addClass('panels-preview-processed')
      .click(function () {
        if (!$('#panels-preview').size()) {
          $('#panels-dnd-main').parents('form').after('<div id="panels-preview" class="clearfix"></div>');
        }
        var html = '';
        html += '  <div id="modal-throbber">';
        html += '    <div class="modal-throbber-wrapper">';
        html +=        Drupal.settings.CToolsModal.throbber;
        html += '    </div>';
        html += '  </div>';

        $('#panels-preview').html(html);
      });

    var setTitleClass = function () {
      if ($('#edit-display-title-hide-title').val() == 2) {
        $('#panels-dnd-main').removeClass('panels-set-title-hide');
      }
      else {
        $('#panels-dnd-main').addClass('panels-set-title-hide');
      }
    }

    // The panes have an option to set the display title, but only if
    // a select is set to the proper value. This sets a class on the
    // main edit div so that the option to set the display title
    // is hidden if that is not selected, and visible if it is.
    $('#edit-display-title-hide-title:not(.panels-title-processed)')
      .addClass('panels-title-processed')
      .change(setTitleClass);

    setTitleClass();
  }
}

$(function() {
  /**
   * AJAX responder command to render the preview.
   */
  Drupal.ajax.prototype.commands.panel_preview = function(ajax, command, status) {
    $('#panels-preview').html(command.output);
  }
});

})(jQuery);
;
/**
 * @file
 * Implement a simple, clickable dropdown menu.
 *
 * See dropdown.theme.inc for primary documentation.
 *
 * The javascript relies on four classes:
 * - The dropdown must be fully contained in a div with the class
 *   ctools-dropdown. It must also contain the class ctools-dropdown-no-js
 *   which will be immediately removed by the javascript; this allows for
 *   graceful degradation.
 * - The trigger that opens the dropdown must be an a tag wit hthe class
 *   ctools-dropdown-link. The href should just be '#' as this will never
 *   be allowed to complete.
 * - The part of the dropdown that will appear when the link is clicked must
 *   be a div with class ctools-dropdown-container.
 * - Finally, ctools-dropdown-hover will be placed on any link that is being
 *   hovered over, so that the browser can restyle the links.
 *
 * This tool isn't meant to replace click-tips or anything, it is specifically
 * meant to work well presenting menus.
 */

(function ($) {
  Drupal.behaviors.CToolsDropdown = {
    attach: function() {
      $('div.ctools-dropdown').once('ctools-dropdown', function() {
        var $dropdown = $(this);
        var open = false;
        var hovering = false;
        var timerID = 0;

        $dropdown.removeClass('ctools-dropdown-no-js');

        var toggle = function(close) {
          // if it's open or we're told to close it, close it.
          if (open || close) {
            // If we're just toggling it, close it immediately.
            if (!close) {
              open = false;
              $("div.ctools-dropdown-container", $dropdown).slideUp(100);
            }
            else {
              // If we were told to close it, wait half a second to make
              // sure that's what the user wanted.
              // Clear any previous timer we were using.
              if (timerID) {
                clearTimeout(timerID);
              }
              timerID = setTimeout(function() {
                if (!hovering) {
                  open = false;
                  $("div.ctools-dropdown-container", $dropdown).slideUp(100);
                }
              }, 500);
            }
          }
          else {
            // open it.
            open = true;
            $("div.ctools-dropdown-container", $dropdown)
              .animate({height: "show", opacity: "show"}, 100);
          }
        }
        $("a.ctools-dropdown-link", $dropdown).click(function() {
          toggle();
          return false;
        });

        $dropdown.hover(
            function() {
              hovering = true;
            }, // hover in
            function() { // hover out
              hovering = false;
              toggle(true);
              return false;
            });
        // @todo -- just use CSS for this noise.
        $("div.ctools-dropdown-container a").hover(
          function() { $(this).addClass('ctools-dropdown-hover'); },
          function() { $(this).removeClass('ctools-dropdown-hover'); }
        );
      });
    }
  }
})(jQuery);
;
(function ($) {

  Drupal.bootstrap = Drupal.bootstrap || {};

  Drupal.bootstrap.classSelectors = [];

  Drupal.behaviors.bootstrapAdmin = {
    attach: function(context) {
      // Show/hide layout manager button
      $('input#panels-bootstrap-toggle-layout:not(.panels-bootstrap-processed)', context)
        .addClass('panels-bootstrap-processed')
        .click(function() {
          $('.panel-bootstrap-admin')
            .toggleClass('panel-bootstrap-no-edit-layout')
            .toggleClass('panel-bootstrap-edit-layout');

          if ($('.panel-bootstrap-admin').hasClass('panel-bootstrap-edit-layout')) {
            $(this).val(Drupal.t('Hide layout designer'));
          }
          else {
            $(this).val(Drupal.t('Show layout designer'));
          }
          return false;
        });

      // Window splitter behavior.
      $('div.bootstrap-class-selector:not(.bootstrap-class-selector-processed)')
        .addClass('bootstrap-class-selector-processed')
        .each(function() {
          Drupal.bootstrap.classSelectors.push(new Drupal.bootstrap.classSelector($(this).find('select')));
        });
    }
  };


  Drupal.bootstrap.classSelector = function($classSelector) {
    var $this = this;
    var $selectorFor = $("#"+$classSelector.attr('data-for'));
    $classSelector.bind('change',function(){
      Drupal.bootstrap.removeClasses($selectorFor);
      $selectorFor.addClass($classSelector.val());
      Drupal.ajax['bootstrap-class-selector-ajax'].options.data = {
        'item': $classSelector.attr('data-for-id'),
        'bootstrap_class': $classSelector.val()
      };
      jQuery('.panel-bootstrap-edit-layout').trigger('updateBootstrapClass');
    })
  }

  Drupal.bootstrap.removeClasses = function($row){
     $row.removeClass(function() { /* Matches even table-col-row */
       var classesToRemove = '',
       classes = this.className.split(' ');
       for(var i = 0; i < classes.length; i++ ) {
           if( /span\d{1,3}/.test( classes[i] ) ) { /* Filters */
               classesToRemove += classes[i] + ' ';
           }
       }
       return classesToRemove ; /* Returns all classes to be removed */
    });
  }

  $(function() {

    // Create a generic ajax callback for use with the splitters which
    // background AJAX to store their data.
    var element_settings = {
      url: Drupal.settings.bootstrap.resize,
      event: 'updateBootstrapClass',
      keypress: false,
      // No throbber at all.
      progress: { 'type': 'throbber' }
    };

    Drupal.ajax['bootstrap-class-selector-ajax'] = new Drupal.ajax('bootstrap-class-selector-ajax', $('.panel-bootstrap-admin').get(0), element_settings);

    // Prevent ajax goo from doing odd things to our layout.
    Drupal.ajax['bootstrap-class-selector-ajax'].beforeSend = function() { };
    Drupal.ajax['bootstrap-class-selector-ajax'].beforeSerialize = function() { };

  });

})(jQuery);
;
/**
 * @file
 * Javascript required for a simple collapsible div.
 *
 * Creating a collapsible div with this doesn't take too much. There are
 * three classes necessary:
 *
 * - ctools-collapsible-container: This is the overall container that will be
 *   collapsible. This must be a div.
 * - ctools-collapsible-handle: This is the title area, and is what will be
 *   visible when it is collapsed. This can be any block element, such as div
 *   or h2.
 * - ctools-collapsible-content: This is the ocntent area and will only be
 *   visible when expanded. This must be a div.
 *
 * Adding 'ctools-collapsible-remember' to the container class will cause the
 * state of the container to be stored in a cookie, and remembered from page
 * load to page load. This will only work if the container has a unique ID, so
 * very carefully add IDs to your containers.
 *
 * If the class 'ctools-no-container' is placed on the container, the container
 * will be the handle. The content will be found by appending '-content' to the
 * id of the handle. The ctools-collapsible-handle and
 * ctools-collapsible-content classes will not be required in that case, and no
 * restrictions on what of data the container is are placed. Like
 * ctools-collapsible-remember this requires an id to eist.
 *
 * The content will be 'open' unless the container class has 'ctools-collapsed'
 * as a class, which will cause the container to draw collapsed.
 */

(function ($) {
  // All CTools tools begin with this if they need to use the CTools namespace.
  if (!Drupal.CTools) {
    Drupal.CTools = {};
  }

  /**
   * Object to store state.
   *
   * This object will remember the state of collapsible containers. The first
   * time a state is requested, it will check the cookie and set up the variable.
   * If a state has been changed, when the window is unloaded the state will be
   * saved.
   */
  Drupal.CTools.Collapsible = {
    state: {},
    stateLoaded: false,
    stateChanged: false,
    cookieString: 'ctools-collapsible-state=',

    /**
     * Get the current collapsed state of a container.
     *
     * If set to 1, the container is open. If set to -1, the container is
     * collapsed. If unset the state is unknown, and the default state should
     * be used.
     */
    getState: function (id) {
      if (!this.stateLoaded) {
        this.loadCookie();
      }

      return this.state[id];
    },

    /**
     * Set the collapsed state of a container for subsequent page loads.
     *
     * Set the state to 1 for open, -1 for collapsed.
     */
    setState: function (id, state) {
      if (!this.stateLoaded) {
        this.loadCookie();
      }

      this.state[id] = state;

      if (!this.stateChanged) {
        this.stateChanged = true;
        $(window).unload(this.unload);
      }
    },

    /**
     * Check the cookie and load the state variable.
     */
    loadCookie: function () {
      // If there is a previous instance of this cookie
      if (document.cookie.length > 0) {
        // Get the number of characters that have the list of values
        // from our string index.
        offset = document.cookie.indexOf(this.cookieString);

        // If its positive, there is a list!
        if (offset != -1) {
          offset += this.cookieString.length;
          var end = document.cookie.indexOf(';', offset);
          if (end == -1) {
            end = document.cookie.length;
          }

          // Get a list of all values that are saved on our string
          var cookie = unescape(document.cookie.substring(offset, end));

          if (cookie != '') {
            var cookieList = cookie.split(',');
            for (var i = 0; i < cookieList.length; i++) {
              var info = cookieList[i].split(':');
              this.state[info[0]] = info[1];
            }
          }
        }
      }

      this.stateLoaded = true;
    },

    /**
     * Turn the state variable into a string and store it in the cookie.
     */
    storeCookie: function () {
      var cookie = '';

      // Get a list of IDs, saparated by comma
      for (i in this.state) {
        if (cookie != '') {
          cookie += ',';
        }
        cookie += i + ':' + this.state[i];
      }

      // Save this values on the cookie
      document.cookie = this.cookieString + escape(cookie) + ';path=/';
    },

    /**
     * Respond to the unload event by storing the current state.
     */
    unload: function() {
      Drupal.CTools.Collapsible.storeCookie();
    }
  };

  // Set up an array for callbacks.
  Drupal.CTools.CollapsibleCallbacks = [];
  Drupal.CTools.CollapsibleCallbacksAfterToggle = [];

  /**
   * Bind collapsible behavior to a given container.
   */
  Drupal.CTools.bindCollapsible = function () {
    var $container = $(this);

    // Allow the specification of the 'no container' class, which means the
    // handle and the container can be completely independent.
    if ($container.hasClass('ctools-no-container') && $container.attr('id')) {
      // In this case, the container *is* the handle and the content is found
      // by adding '-content' to the id. Obviously, an id is required.
      var handle = $container;
      var content = $('#' + $container.attr('id') + '-content');
    }
    else {
      var handle = $container.children('.ctools-collapsible-handle');
      var content = $container.children('div.ctools-collapsible-content');
    }

    if (content.length) {
      // Create the toggle item and place it in front of the toggle.
      var toggle = $('<span class="ctools-toggle"></span>');
      handle.before(toggle);

      // If the remember class is set, check to see if we have a remembered
      // state stored.
      if ($container.hasClass('ctools-collapsible-remember') && $container.attr('id')) {
        var state = Drupal.CTools.Collapsible.getState($container.attr('id'));
        if (state == 1) {
          $container.removeClass('ctools-collapsed');
        }
        else if (state == -1) {
          $container.addClass('ctools-collapsed');
        }
      }

      // If we should start collapsed, do so:
      if ($container.hasClass('ctools-collapsed')) {
        toggle.toggleClass('ctools-toggle-collapsed');
        content.hide();
      }

      var afterToggle = function () {
        if (Drupal.CTools.CollapsibleCallbacksAfterToggle) {
          for (i in Drupal.CTools.CollapsibleCallbacksAfterToggle) {
            Drupal.CTools.CollapsibleCallbacksAfterToggle[i]($container, handle, content, toggle);
          }
        }
      }

      var clickMe = function () {
        if (Drupal.CTools.CollapsibleCallbacks) {
          for (i in Drupal.CTools.CollapsibleCallbacks) {
            Drupal.CTools.CollapsibleCallbacks[i]($container, handle, content, toggle);
          }
        }

        // If the container is a table element slideToggle does not do what
        // we want, so use toggle() instead.
        if ($container.is('table')) {
          content.toggle(0, afterToggle);
        }
        else {
          content.slideToggle(100, afterToggle);
        }

        toggle.toggleClass('ctools-toggle-collapsed');

        // If we're supposed to remember the state of this class, do so.
        if ($container.hasClass('ctools-collapsible-remember') && $container.attr('id')) {
          var state = toggle.hasClass('ctools-toggle-collapsed') ? -1 : 1;
          Drupal.CTools.Collapsible.setState($container.attr('id'), state);
        }

        return false;
      }

      // Let both the toggle and the handle be clickable.
      toggle.click(clickMe);
      handle.click(clickMe);
    }
  };

  /**
   * Support Drupal's 'behaviors' system for binding.
   */
  Drupal.behaviors.CToolsCollapsible = {
    attach: function(context) {
      $('.ctools-collapsible-container', context).once('ctools-collapsible', Drupal.CTools.bindCollapsible);
    }
  }
})(jQuery);
;
/**
 * @file
 * Provides dependent visibility for form items in CTools' ajax forms.
 *
 * To your $form item definition add:
 * - '#process' => array('ctools_process_dependency'),
 * - '#dependency' => array('id-of-form-item' => array(list, of, values, that,
 *   make, this, item, show),
 *
 * Special considerations:
 * - Radios are harder. Because Drupal doesn't give radio groups individual IDs,
 *   use 'radio:name-of-radio'.
 *
 * - Checkboxes don't have their own id, so you need to add one in a div
 *   around the checkboxes via #prefix and #suffix. You actually need to add TWO
 *   divs because it's the parent that gets hidden. Also be sure to retain the
 *   'expand_checkboxes' in the #process array, because the CTools process will
 *   override it.
 */

(function ($) {
  Drupal.CTools = Drupal.CTools || {};
  Drupal.CTools.dependent = {};

  Drupal.CTools.dependent.bindings = {};
  Drupal.CTools.dependent.activeBindings = {};
  Drupal.CTools.dependent.activeTriggers = [];

  Drupal.CTools.dependent.inArray = function(array, search_term) {
    var i = array.length;
    while (i--) {
      if (array[i] == search_term) {
         return true;
      }
    }
    return false;
  }


  Drupal.CTools.dependent.autoAttach = function() {
    // Clear active bindings and triggers.
    for (i in Drupal.CTools.dependent.activeTriggers) {
      $(Drupal.CTools.dependent.activeTriggers[i]).unbind('change');
    }
    Drupal.CTools.dependent.activeTriggers = [];
    Drupal.CTools.dependent.activeBindings = {};
    Drupal.CTools.dependent.bindings = {};

    if (!Drupal.settings.CTools) {
      return;
    }

    // Iterate through all relationships
    for (id in Drupal.settings.CTools.dependent) {
      // Test to make sure the id even exists; this helps clean up multiple
      // AJAX calls with multiple forms.

      // Drupal.CTools.dependent.activeBindings[id] is a boolean,
      // whether the binding is active or not.  Defaults to no.
      Drupal.CTools.dependent.activeBindings[id] = 0;
      // Iterate through all possible values
      for(bind_id in Drupal.settings.CTools.dependent[id].values) {
        // This creates a backward relationship.  The bind_id is the ID
        // of the element which needs to change in order for the id to hide or become shown.
        // The id is the ID of the item which will be conditionally hidden or shown.
        // Here we're setting the bindings for the bind
        // id to be an empty array if it doesn't already have bindings to it
        if (!Drupal.CTools.dependent.bindings[bind_id]) {
          Drupal.CTools.dependent.bindings[bind_id] = [];
        }
        // Add this ID
        Drupal.CTools.dependent.bindings[bind_id].push(id);
        // Big long if statement.
        // Drupal.settings.CTools.dependent[id].values[bind_id] holds the possible values

        if (bind_id.substring(0, 6) == 'radio:') {
          var trigger_id = "input[name='" + bind_id.substring(6) + "']";
        }
        else {
          var trigger_id = '#' + bind_id;
        }

        Drupal.CTools.dependent.activeTriggers.push(trigger_id);

        if ($(trigger_id).attr('type') == 'checkbox') {
          $(trigger_id).siblings('label').addClass('hidden-options');
        }

        var getValue = function(item, trigger) {
          if ($(trigger).size() == 0) {
            return null;
          }

          if (item.substring(0, 6) == 'radio:') {
            var val = $(trigger + ':checked').val();
          }
          else {
            switch ($(trigger).attr('type')) {
              case 'checkbox':
                var val = $(trigger).attr('checked') ? true : false;

                if (val) {
                  $(trigger).siblings('label').removeClass('hidden-options').addClass('expanded-options');
                }
                else {
                  $(trigger).siblings('label').removeClass('expanded-options').addClass('hidden-options');
                }

                break;
              default:
                var val = $(trigger).val();
            }
          }
          return val;
        }

        var setChangeTrigger = function(trigger_id, bind_id) {
          // Triggered when change() is clicked.
          var changeTrigger = function() {
            var val = getValue(bind_id, trigger_id);

            if (val == null) {
              return;
            }

            for (i in Drupal.CTools.dependent.bindings[bind_id]) {
              var id = Drupal.CTools.dependent.bindings[bind_id][i];
              // Fix numerous errors
              if (typeof id != 'string') {
                continue;
              }

              // This bit had to be rewritten a bit because two properties on the
              // same set caused the counter to go up and up and up.
              if (!Drupal.CTools.dependent.activeBindings[id]) {
                Drupal.CTools.dependent.activeBindings[id] = {};
              }

              if (val != null && Drupal.CTools.dependent.inArray(Drupal.settings.CTools.dependent[id].values[bind_id], val)) {
                Drupal.CTools.dependent.activeBindings[id][bind_id] = 'bind';
              }
              else {
                delete Drupal.CTools.dependent.activeBindings[id][bind_id];
              }

              var len = 0;
              for (i in Drupal.CTools.dependent.activeBindings[id]) {
                len++;
              }

              var object = $('#' + id + '-wrapper');
              if (!object.size()) {
                // Some elements can't use the parent() method or they can
                // damage things. They are guaranteed to have wrappers but
                // only if dependent.inc provided them. This check prevents
                // problems when multiple AJAX calls cause settings to build
                // up.
                var $original = $('#' + id);
                if ($original.is('fieldset') || $original.is('textarea')) {
                  continue;
                }

                object = $('#' + id).parent();
              }

              if (Drupal.settings.CTools.dependent[id].type == 'disable') {
                if (Drupal.settings.CTools.dependent[id].num <= len) {
                  // Show if the element if criteria is matched
                  object.attr('disabled', false);
                  object.addClass('dependent-options');
                  object.children().attr('disabled', false);
                }
                else {
                  // Otherwise hide. Use css rather than hide() because hide()
                  // does not work if the item is already hidden, for example,
                  // in a collapsed fieldset.
                  object.attr('disabled', true);
                  object.children().attr('disabled', true);
                }
              }
              else {
                if (Drupal.settings.CTools.dependent[id].num <= len) {
                  // Show if the element if criteria is matched
                  object.show(0);
                  object.addClass('dependent-options');
                }
                else {
                  // Otherwise hide. Use css rather than hide() because hide()
                  // does not work if the item is already hidden, for example,
                  // in a collapsed fieldset.
                  object.css('display', 'none');
                }
              }
            }
          }

          $(trigger_id).change(function() {
            // Trigger the internal change function
            // the attr('id') is used because closures are more confusing
            changeTrigger(trigger_id, bind_id);
          });
          // Trigger initial reaction
          changeTrigger(trigger_id, bind_id);
        }
        setChangeTrigger(trigger_id, bind_id);
      }
    }
  }

  Drupal.behaviors.CToolsDependent = {
    attach: function (context) {
      Drupal.CTools.dependent.autoAttach();

      // Really large sets of fields are too slow with the above method, so this
      // is a sort of hacked one that's faster but much less flexible.
      $("select.ctools-master-dependent")
        .once('ctools-dependent')
        .change(function() {
          var val = $(this).val();
          if (val == 'all') {
            $('.ctools-dependent-all').show(0);
          }
          else {
            $('.ctools-dependent-all').hide(0);
            $('.ctools-dependent-' + val).show(0);
          }
        })
        .trigger('change');
    }
  }
})(jQuery);
;
