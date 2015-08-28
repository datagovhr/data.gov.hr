// Monkey-patch broken functionality in Recline.
// We aren't using maps, havent loaded Leaflet, so do not try to use it.
recline.View.Map.prototype._setupMap = function() {};

// Integration point between DGU and Recline. Based on code from CKAN, stripped to requirements.
CKAN.Dgu.resourcePreviewer = (function($,my) {
  my.$dialog = function() { return $('#ckanext-datapreview'); }

  // **Public: Creates a link to the embeddable page.
  //
  // For a given DataExplorer state, this function constructs and returns the
  // url to the embeddable view of the current dataexplorer state.
  my.makeEmbedLink = function(explorerState) {
    var state = explorerState.toJSON();
    state.state_version = 1;

    var queryString = '?';
    var items = [];
    $.each(state, function(key, value) {
      if (typeof(value) === 'object') {
        value = JSON.stringify(value);
      }
      items.push(key + '=' + escape(value));
    });
    queryString += items.join('&');
    return embedPath + queryString;
  };

  // **Public: Loads a data preview**
  //
  // Fetches the preview data object from the link provided and loads the
  // parsed data from the webstore displaying it in the most appropriate
  // manner.
  //
  // link - Preview button.
  //
  // Returns nothing.
  my.loadPreviewDialog = function(resourceData) {
    my.$dialog().html('<h4>Loading ... <img src="http://assets.okfn.org/images/icons/ajaxload-circle.gif" class="loading-spinner" /></h4>');

    function initializeDataExplorer(dataset) {
      var views = [
        {
          id: 'grid',
          label: 'Grid',
          view: new recline.View.Grid({
            model: dataset
          })
        },
        {
          id: 'graph',
          label: 'Graph',
          view: new recline.View.Graph({
            model: dataset
          })
        },
        {
          id: 'map',
          label: 'Map',
          view: new recline.View.Map({
            model: dataset
          })
        }
      ];
      var dataExplorer = new recline.View.DataExplorer({
        el: my.$dialog(),
        model: dataset,
        views: views,
        config: {
          readOnly: true
        }
      });

      // Upon failure of the datapreivew to load...
      // 1. Hide the controls
      // 2. Hide the space reserved for the preview itself.
      // 3. Disable the Embed button
      dataExplorer.model.bind('query:fail', function(error) {
        $('#ckanext-datapreview .data-view-container').hide();
        $('#ckanext-datapreview .header').hide();
        $('.preview-header .btn').hide();
      });

      // -----------------------------
      // Setup the Embed modal dialog.
      // -----------------------------

      // embedLink holds the url to the embeddable view of the current DataExplorer state.
      var embedLink = $('.embedLink');

      // embedIframeText contains the '<iframe>' construction, which sources
      // the above link.
      var embedIframeText = $('.embedIframeText');

      // iframeWidth and iframeHeight control the width and height parameters
      // used to construct the iframe, and are also used in the link.
      var iframeWidth = $('.iframe-width');
      var iframeHeight = $('.iframe-height');

      // Update the embedLink and embedIframeText to contain the updated link
      // and update width and height parameters.
      function updateLink() {
        var link = my.makeEmbedLink(dataExplorer.state);
        var width = iframeWidth.val();
        var height = iframeHeight.val();
        link += '&width='+width+'&height='+height;

        // Escape '"' characters in {{link}} in order not to prematurely close
        // the src attribute value.
        embedIframeText.val($.mustache('<iframe frameBorder="0" width="{{width}}" height="{{height}}" src="{{link}}"></iframe>',
                                       {
                                         link: link.replace(/"/g, '&quot;'),
                                         width: width,
                                         height: height
                                       }));
        embedLink.attr('href', link);
      }

      // Bind changes to the DataExplorer, or the two width and height inputs
      // to re-calculate the url.
      dataExplorer.state.bind('change', updateLink);
      for (var i=0; i<dataExplorer.pageViews.length; i++) {
        dataExplorer.pageViews[i].view.state.bind('change', updateLink);
      }

      iframeWidth.change(updateLink);
      iframeHeight.change(updateLink);

      // Initial population of embedLink and embedIframeText
      updateLink();

      // Finally, since we have a DataExplorer, we can show the embed button.
      $('.preview-header .btn').show();

      // will have to refactor if this can get called multiple times
      Backbone.history.start();
    }

    // 4 situations
    // a) have a webstore_url
    // b) csv or xls (but not webstore)
    // c) can be treated as plain text
    // d) none of the above but worth iframing (assumption is
    // that if we got here (i.e. preview shown) worth doing
    // something ...)
    resourceData.formatNormalized = my.normalizeFormat(resourceData.format);
    resourceData.url  = my.normalizeUrl(resourceData.url);
    if (resourceData.formatNormalized == '') {
      var tmp = resourceData.url.split('/');
      tmp = tmp[tmp.length - 1];
      tmp = tmp.split('?'); // query strings
      tmp = tmp[0];
      var ext = tmp.split('.');
      if (ext.length > 1) {
        resourceData.formatNormalized = ext[ext.length-1];
      }
    }

    if (resourceData.webstore_url) {
      resourceData.elasticsearch_url = '/api/data/' + resourceData.id;
      var dataset = new recline.Model.Dataset(resourceData, 'elasticsearch');
      initializeDataExplorer(dataset);
    }
    else if (resourceData.formatNormalized in {'csv': '', 'xls': '', 'tsv': '', 'ods': ''}) {
      // set format as this is used by Recline in setting format for DataProxy
      resourceData.format = resourceData.formatNormalized;
      var dataset = new recline.Model.Dataset(resourceData, 'dataproxy');
      initializeDataExplorer(dataset);
      $('.recline-query-editor .text-query').hide();
    }
    else if (resourceData.formatNormalized in {
        'n3': '',
        'n-triples': '',
        'turtle': '',
        'plain': '',
        'txt': ''
        }) {
      var _url = '/data/preview/' + resourceData.id + '?type=plain';
      my.getResourceDataDirect(_url, function(data) {
        my.showPlainTextData(data);
      });
    }
    else if (resourceData.formatNormalized in {'html':'', 'htm':''}
        ||  resourceData.url.substring(0,23)=='http://docs.google.com/') {
      // we displays a fullscreen dialog with the url in an iframe.
      my.$dialog().empty();
      var el = $('<iframe></iframe>');
      el.attr('src', resourceData.url);
      el.attr('width', '100%');
      el.attr('height', '100%');
      // Change this to be a specific element for #977
      $('#ckanext-html-preview').append(el);
      //my.$dialog().append(el);
    }
    // images
    else if (resourceData.formatNormalized in {'png':'', 'jpg':'', 'gif':''}
        ||  resourceData.resource_type=='image') {
      // we displays a fullscreen dialog with the url in an iframe.
      my.$dialog().empty();
      var el = $('<img />');
      el.attr('src', resourceData.url);
      el.css('max-width', '100%');
      el.css('border', 'solid 4px black');
      my.$dialog().append(el);
    }
    else {
      // Cannot reliably preview this item - with no mimetype/format information,
      // can't guarantee it's not a remote binary file such as an executable.
      my.showError({
        title: 'Preview not available for data type: ' + resourceData.formatNormalized,
        message: ''
      });
    }
  };

  // Public: Requests the formatted resource data from the webstore and
  // passes the data into the callback provided.
  //
  // preview - A preview object containing resource metadata.
  // callback - A Function to call with the data when loaded.
  //
  // Returns nothing.
  my.getResourceDataDirect = function(url, callback) {
    // $.ajax() does not call the "error" callback for JSONP requests so we
    // set a timeout to provide the callback with an error after x seconds.
    var timeout = 30000;
    var timer = setTimeout(function error() {
      callback({
        error: {
          title: 'Request Error',
          message: 'Dataproxy server did not respond after ' + (timeout / 1000) + ' seconds'
        }
      });
    }, timeout);

    // We need to provide the `cache: true` parameter to prevent jQuery appending
    // a cache busting `={timestamp}` parameter to the query as the webstore
    // currently cannot handle custom parameters.
    $.ajax({
      url: url,
      cache: true,
      dataType: 'json',
      success: function(data) {
        clearTimeout(timer);
        callback(data);
      },
      error: function(err) {
          clearTimeout(timer);
          callback({
            error: {
              title: 'Request Error',
              message: 'There was an error processing the request'
            }
          });
      }
    });
  };

  // Public: Displays a String of data in a fullscreen dialog.
  //
  // data    - An object of parsed CSV data returned by the webstore.
  //
  // Returns nothing.
  my.showPlainTextData = function(data) {
    if(data.error) {
      my.showError(data.error);
    } else {
      var content = $('<pre></pre>');
      for (var i=0; i<data.data.length; i++) {
        var row = data.data[i].join(',') + '\n';
        content.append(my.escapeHTML(row));
      }
      my.$dialog().html(content);
    }
  };

  my.showError = function (error) {
    var _html = _.template(
        '<div class="panel panel-danger"><div class="panel-heading"><strong><%= title %></strong></div><div class="panel-body"><%= message %></div></div>',
        error
    );
    my.$dialog().html(_html);
  };

  my.normalizeFormat = function(format) {
    var out = format.toLowerCase();
    out = out.split('/');
    out = out[out.length-1];
    return out;
  };

  my.normalizeUrl = function(url) {
    if (url.indexOf('https') === 0) {
      return 'http' + url.slice(5);
    } else {
      return url;
    }
  }

  // Public: Escapes HTML entities to prevent broken layout and XSS attacks
  // when inserting user generated or external content.
  //
  // string - A String of HTML.
  //
  // Returns a String with HTML special characters converted to entities.
  my.escapeHTML = function (string) {
    return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;')
                 .replace(/</g, '&lt;').replace(/>/g, '&gt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#x27')
                 .replace(/\//g,'&#x2F;');
  };

  return my;
})(jQuery, CKAN.Dgu.resourcePreviewer || {});

