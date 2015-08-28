<article id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix"<?php print $attributes; ?>>

  <?php if (!$page && $title): ?>
    <h1 class="node-title" <?php print $title_attributes; ?>><a href="<?php print $node_url; ?>"><?php print $title; ?></a></h1>
  <?php elseif ($title): ?>
    <h1 class="node-title" <?php print $title_attributes; ?>><?php print $title; ?></h1>
  <?php endif; ?>

  <header>
    <?php print render($content['field_rating']); ?>
    <span class="submitted">
      <?php print $user_picture; ?>
      <?php print $submitted; ?>
    </span>
    <?php if ($updated): ?>
      <span class="submitted">
        <?php print $updated; ?>
      </span>
    <?php endif; ?>
    <div class="taxonomy">
      <?php print render($content['field_category']); ?>
      <?php print render($content['field_tags']); ?>
    </div>
    <?php print render($content['field_developed_by']); ?>
    <?php print render($content['field_app_link']); ?>
    <?php print render($content['field_app_charge']); ?>


  </header>
  <?php
    // Hide comments, tags, and links now so that we can render them later.
    hide($content['links']);
    hide($content['field_comment']);
    print render($content);
  ?>

  <div class="disclaimer disclaimer-app">
    Aplikacije koje se šalju za katalogiziranje na Portal otvorenih podataka odobravaju se na temelju općeg konteksta i same prikladnosti aplikacija. Nismo dužni odobriti i objaviti svaku prijavljenu aplikaciju. Iako se periodično radi na pregledavanju ovih aplikacija, ograđujemo se od bilo kakve odgovornosti za sadržaj, kao i za samo funkcioniranje objavljenih aplikacija. Za bilo kakve upite o aplikacijama molimo obratite se instituciji koja ju je razvila, odnosno nadležnom razvojnom programeru.
  </div>
</article> <!-- /.node -->

<?php if (!empty($content['links']) || !empty($content['field_comment'])): ?>
  <footer>
    <?php print render($content['field_comment']); ?>
    <?php print render($content['links']); ?>
  </footer>
<?php endif; ?>