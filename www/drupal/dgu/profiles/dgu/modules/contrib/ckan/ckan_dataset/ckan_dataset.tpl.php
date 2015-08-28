<?php

/**
 * @file
 * A basic template for CKAN Datasets
 *
 * Available variables:
 * - $content: An array of comment items. Use render($content) to print them all, or
 *   print a subset such as render($content['field_example']). Use
 *   hide($content['field_example']) to temporarily suppress the printing of a
 *   given element.
 * - $title: The name of the CKAN Dataset
 * - $url: The standard URL for viewing a CKAN Dataset
 * - $page: TRUE if this is the main view page $url points too.
 * - $classes: String of classes that can be used to style contextually through
 *   CSS. It can be manipulated through the variable $classes_array from
 *   preprocess functions. By default the following classes are available, where
 *   the parts enclosed by {} are replaced by the appropriate values:
 *   - entity-profile
 *   - ckan_dataset-{TYPE}
 *
 * Other variables:
 * - $classes_array: Array of html class attribute values. It is flattened
 *   into a string within the variable $classes.
 *
 * @see template_preprocess()
 * @see template_preprocess_entity()
 * @see template_process()
 */
?>
<div class="<?php print $classes; ?> clearfix"<?php print $attributes; ?>>

  <?php
    $publisher_link = '#';
    if ($ckan_dataset->publisher_id) {
        $publisher = entity_load_single('ckan_publisher', $ckan_dataset->publisher_id);
        $publisher_link = l($publisher->title, 'ckan_publisher/' . $ckan_dataset->publisher_id);
    }
    $author = user_load($ckan_dataset->uid);

    print 'id: ' . $ckan_dataset->id . '<br />';
    print 'ckan_id: ' . $ckan_dataset->ckan_id . '<br />';
    print 'name: ' . $ckan_dataset->name . '<br />';
    if ($author) {
      print 'published by: ' . l($author->name, 'user/' . $author->uid) . '<br />';
    }
    print 'publisher: ' . $publisher_link . '<br />';
    print 'inventory: ' . $ckan_dataset->inventory . '<br />';
    print 'notes: <br />' . $ckan_dataset->notes . '<br />';
  ?>

</div>
