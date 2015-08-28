<?php

/**
 * @file
 * Themer editor form.
 */
?>
<div id="sweaver">

  <!-- tabs -->
  <div id="sweaver-tabs" class="clearfix">
    <div class="close<?php ($sweaver_open == 'true' || $sweaver_open == NULL) ? '' : print ' active-tab'; ?>"><?php print '<a href="#">x</a>'; ?></div>
    <?php
    $i = 1;
    foreach ($tabs as $key => $tab):
    ?>
      <div id="tab-<?php print $key; ?>" class="tab <?php if (($active_tab == $key) || ($active_tab == NULL && $i == 1 )) print 'active-tab'; ?> <?php print $key; ?>">
        <a href="#"><?php print $tab['#tab_name']; ?></a>
      </div>
    <?php
    $i++;
    endforeach; ?>
    <?php if (isset($style_actions)): ?>
      <div id="sweaver-style-actions"><?php print $style_actions; ?></div>
    <?php endif; ?>
  </div>

  <div id="sweaver-middle" class="clearfix" <?php ($sweaver_open == 'true' || $sweaver_open == NULL) ? '' : print ' style="height:0"'; ?>>
    <?php
    foreach ($tabs_data as $key => $tab_data):
    ?>
      <!-- <?php print $key; ?> -->
      <div id="<?php print $key;?>">
        <?php if (isset($tab_data['#tab_description'])): ?>
          <div class="sweaver-header" <?php ($active_tab != $key) ? print 'style="display:none"' : '' ?>><?php print $tab_data['#tab_description']; ?></div>
        <?php endif; ?>
        <div class="sweaver-content" style="<?php if ($active_tab != $key) print 'display:none;'; ?>"><?php print $tab_data['content']; ?></div>
      </div>
    <?php
      endforeach;
    ?>
  </div>


  <?php print $rest_of_form; ?>
</div>
<div id="sweaver-popup"><div class="close">x</div><div class="content"><?php print $sweaver_popup; ?></div></div>