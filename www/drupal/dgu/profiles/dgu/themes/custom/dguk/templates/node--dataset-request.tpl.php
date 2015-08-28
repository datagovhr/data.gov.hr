<article id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix"<?php print $attributes; ?>>

  <?php print render($title_prefix); ?>
  <h1 class="node-title" <?php print $title_attributes; ?>><?php print $title; ?></h1>
  <?php print render($title_suffix); ?>

  <?php if (!$field_publication_preference[LANGUAGE_NONE][0]['value']): ?>
    <p class="confidential"><?php echo t('Confidential request');?></p>
  <?php endif; ?>

  <header>
    <span class="submitted">
      <?php print $submitted; ?>
    </span>
    <?php if ($updated): ?>
      <span class="submitted">
        <?php print $updated; ?>
      </span>
    <?php endif; ?>
   
    <div class="taxonomy">
      <?php print render($content['field_data_themes']); ?>
    </div>

  </header>

  <?php
    // Hide comments, tags, and links now so that we can render them later.
    hide($content['links']);
    hide($content['field_comment']);

    // We hide following here not in in 'Manage display' for a reason:
    // This have to be not <hidden> in 'Manage display' to don't mess up with field groups dependent visibility.
    hide($content['field_barriers_attempted']);
    // This is just quicker to get '#markup' instead of integer value ready for us.
    hide($content['field_organisation_type']);

    print render($content);
  ?>
</article> <!-- /.node -->

<?php if (!empty($content['links']) || !empty($content['field_comment'])): ?>
  <footer>
    <?php print render($content['field_comment']); ?>
    <?php print render($content['links']); ?>
  </footer>
<?php endif; ?>
