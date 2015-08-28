<?php

/**
 * @file
 * A basic template for CKAN Publishers
 *
 * Available variables:
 * - $content: An array of comment items. Use render($content) to print them all, or
 *   print a subset such as render($content['field_example']). Use
 *   hide($content['field_example']) to temporarily suppress the printing of a
 *   given element.
 * - $title: The name of the CKAN Publisher
 * - $url: The standard URL for viewing a CKAN Publisher
 * - $page: TRUE if this is the main view page $url points too.
 * - $classes: String of classes that can be used to style contextually through
 *   CSS. It can be manipulated through the variable $classes_array from
 *   preprocess functions. By default the following classes are available, where
 *   the parts enclosed by {} are replaced by the appropriate values:
 *   - entity-profile
 *   - ckan_publisher-{TYPE}
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

  // TODO - move logic to proper place

    print 'id: ' . $ckan_publisher->id . '<br />';
    print 'ckan_id: ' . $ckan_publisher->ckan_id . '<br />';
    print 'name: ' . $ckan_publisher->name . '<br />';

    // Render link to parent publisher if present
    if ($ckan_publisher->parent_id) {
      $parent = entity_load_single('ckan_publisher', $ckan_publisher->parent_id);
      $link = l($parent->title, 'ckan_publisher/' . $ckan_publisher->parent_id);
      print 'parent_publisher: ' . $link . '<br />';
    }

    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'ckan_publisher')->propertyCondition('parent_id', $ckan_publisher->id)->execute();
    if (isset($result['ckan_publisher'])) {
      print '<br />child_publishers: <br />';
      foreach ($result['ckan_publisher'] as $key => $value) {
        $child = entity_load_single('ckan_publisher', $key);
        $link = l($child->title, 'ckan_publisher/' . $key);
        print $link . '<br />';
      }
    }

    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'ckan_dataset')->propertyCondition('publisher_id', $ckan_publisher->id)->execute();
    if (isset($result['ckan_dataset'])) {
      print '<br />datasets: <br />';
      foreach ($result['ckan_dataset'] as $key => $value) {
        $dataset = entity_load_single('ckan_dataset', $key);
        // It gets altered in dgu_dataset feature;
        $ckan_link = l($dataset->title, 'ckan_dataset/' . $key);
        $drupal_link = ' | <a href="/ckan_dataset/' . $dataset->id . '">[show in drupal]</a>';
        print $ckan_link . $drupal_link . '<br />';
      }
    }

    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'user')->fieldCondition('field_publishers', 'target_id', $ckan_publisher->id)->execute();
    if (isset($result['user'])) {
      print '<br />users: <br />';
      foreach ($result['user'] as $key => $value) {
        $user = user_load($key);
        $link = l($user->name, 'user/' . $key);
        print $link . '<br />';
      }
    }


  ?>

  <div class="content"<?php print $content_attributes; ?>>
    <?php
      print render($content);
    ?>
  </div>
</div>
