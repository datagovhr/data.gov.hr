<?php

/**
 * @file
 * Template file for the editor configuration form.
 * You get 4 regions and width a configurable label and all enabled
 * properties are available to drag and drop into a region.
 */

  $count = 0;
?>

<div id="editor-configuration-form">

  <table id="properties" class="sticky-enabled">
    <tbody>
    <?php foreach ($rows as $container_key => $container_settings): ?>

      <!-- container -->
      <tr class="container-row" id="<?php print $container_key; ?>">
        <td colspan="3"><?php print $container_settings['textfield']; ?></td>
      </tr>

      <?php if (isset($container_settings['properties'])): ?>
        <?php foreach ($container_settings['properties'] as $property_key => $property): ?>
          <!-- fields -->
          <tr class="<?php print $count % 2 == 0 ? 'odd' : 'even'; ?> draggable">
            <td><?php print $property->name; ?></td>
            <td><?php print $property->container; ?></td>
            <td><?php print $property->weight; ?></td>
          </tr>
        <?php $count++; ?>
        <?php endforeach; ?>
      <?php endif; ?>
    <?php endforeach; ?>

    </tbody>
  </table>

  <?php print $submit; ?>

</div>
