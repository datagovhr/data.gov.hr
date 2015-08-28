<?php $output = drupal_render_children($form);?>
<div class="search-area" >
  <div class="clearfix dgu-equal-height" data-selector=".auto-height">
    <div class="left">
      <div class="left-inner auto-height form-search">
        <div class="input-group">
        <form action="<?php print $form['#action']?>" method="post" id="<?php print $form['#form_id']?>" >
            <input class="form-control" type="text" name="<?php print $form['search_block_form']['#name'] ?>" value="<?php if(!empty($form['keyword']['#value']))print $form['keyword']['#value']?>" results="0" placeholder="Pretraži...">
            <span class="input-group-btn">
              <button type="submit" class="btn btn-default">
                <i class="icon-search"></i>
              </button>
            </span>
            <input type="hidden" name="form_build_id" value="<?php print $form['form_build_id']['#value'] ?>">
            <input type="hidden" name="form_id" value="<?php print $form['form_id']['#value'] ?>">
            <?php if(isset($form['form_token']['#value'])): ?>
              <input type="hidden" name="form_token" value="<?php print $form['form_token']['#value'] ?>">
            <?php endif; ?>
            <?php if(!empty($form['f']['#value']))foreach($form['f']['#value'] as $i => $value): ?>
            <input type="hidden" name="f[<?php print $i; ?>]" value="<?php print $value ?>">
            <?php endforeach; ?>
            <input type="hidden" name="searchtype" value="<?php print $form['searchtype']['#value'] ?>">
            <input type="hidden" name="solrsort" value="<?php print $form['solrsort']['#value'] ?>">
            <input type="hidden" name="submit" value="search">
          </form>
        </div>
        <?php if ($form['show_counter']['#value']): // Show this text only on landing pages (show_counter is set to true on landing pages) ?>
        <span class="search-all-label">Pritisnite ikonu tra&#382;ilice kako bi vidjeli sav sadržaj u ovoj kategoriji</span>
        <?php endif; ?>
      </div>
    </div>
    <?php if ($form['show_counter']['#value']): ?>
    <div class="right">
      <div class="right-inner auto-height">
        <div class="chevron"></div>
	<div class="result-count-header result-count-type" style="text-align:center;">Prona&#273;eno:</div>
        <div class="result-count" style="line-height: 0px;"> <?php print $form['count']['#value']?></div>
        </div>
      </div>
    </div>
    <?php endif; ?>
  </div>
</div>
