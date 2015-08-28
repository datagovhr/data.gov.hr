
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

})(jQuery);