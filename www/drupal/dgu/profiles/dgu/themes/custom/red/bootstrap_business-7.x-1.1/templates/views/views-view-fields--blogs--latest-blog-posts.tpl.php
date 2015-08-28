<?php

/**
 * @file
 * Default simple view template to all the fields as a row.
 *
 * - $view: The view in use.
 * - $fields: an array of $field objects. Each one contains:
 *   - $field->content: The output of the field.
 *   - $field->raw: The raw data for the field, if it exists. This is NOT output safe.
 *   - $field->class: The safe class id to use.
 *   - $field->handler: The Views field handler object controlling this field. Do not use
 *     var_export to dump this object, as it can't handle the recursion.
 *   - $field->inline: Whether or not the field should be inline.
 *   - $field->inline_html: either div or span based on the above flag.
 *   - $field->wrapper_prefix: A complete wrapper containing the inline_html to use.
 *   - $field->wrapper_suffix: The closing tag for the wrapper.
 *   - $field->separator: an optional separator that may appear before a field.
 *   - $field->label: The wrap label text to use.
 *   - $field->label_html: The full HTML of the label to use including
 *     configured element type.
 * - $row: The raw result object from the query, with all data it fetched.
 *
 * @ingroup views_templates
 */

//$history = dgu_site_feature_user_last_visit($row->nid);
//$new_replies = dgu_site_feature_num_new_replies($row->nid, $history);
$colour = $row->users_node_uid % 10;
//
//$last_viewed = node_last_viewed(node_last_viewed);
//$new = $last_viewed ? FALSE : $row->node_created > NODE_NEW_LIMIT;

?>
<div class="blog-posts">
  <div class="views-field field-avatar bg-colour-<?php print $colour; ?>">
    <?php print $fields['field_avatar']->content; ?>
  </div>
  <div class="views-field views-field-title">
    <?php print $fields['title']->content; ?>
  </div>
  <div class="views-field views-field-name">
    <span class="views-label views-label-name">Created by </span><?php print $fields['name']->content . ' ' . $fields['created']->content; ?>
  </div>

  <?php if($new): ?>
    <span class="new">New</span>
  <?php endif; ?>

</div>
<div class="blog-posts-comments">
  <?php if ($fields['created_1']->raw): ?>
    <div class="reply-counter">
      <a href="<?php print drupal_get_path_alias('node/' . $row->nid) . '#comments'; ?>">
        <span><?php print $fields['id']->raw; ?></span>
        <?php print format_plural($fields['id']->raw, ' comment', ' comments'); ?>
        <?php if ($new_replies): ?>
          <span class="new"><?php print $new_replies; ?> new</span>
        <?php endif; ?>
      </a>
    </div>
    <div class="reply-last grey-text">
      <?php if ($fields['id']->raw > 1): ?>
        <span>Last</span>
      <?php endif; ?>
      <?php print $fields['created_1']->content; ?>
    </div>
  <?php else: ?>
    <p class="no-replies grey-text">No comments so far</p>
  <?php endif; ?>
</div>


