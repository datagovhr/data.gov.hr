Welcome to the Reply module.

Installation instructions:
1. Copy all contents of this package to your modules directory (e.g. so that you have a sites/all/modules/reply directory) preserving subdirectory structure.

2. Go to Administer -> Modules to enable module or use "drush en --yes reply"

Configuration instructions:

There are essentially two steps to setting up replies:
1. Create & configure the Bundle
Visit admin/structure/reply and create a 'Bundle'. The bundle represents a collection of fields for the reply. For example, your replies could include a title and larger text field which make up a comment - so create a bundle called 'Comments' with two text fields.
Visit admin/people/permissions and assign permissions for the bundle.

2. Add a Reply field to Entities you wish to add replies to.
Once you have created a Reply bundle, visit the 'Manage Fields' page for the Entity you wish to attach it to. (e.g. Go to admin/structure/taxonomy, edit the vocabulary that you wish to have replies on and go to the 'Manage fields' tab for that vocabulary.) Add a new field of type 'Reply', and then in the Field settings select the bundle you created earlier. Here you can inherit the bundle settings for display, threading etc., or override them for this specific entity/type. Also visit the Manage display tab to ensure your Reply bundle will be displayed.

Administration:
Replies from users are administered in a content tab (similar to the existing Comment module that ships with Drupal) under admin/content/reply.

Frequently Asked Questions:

Q) How can I show author names on replies?
A) Override reply.tpl.php with a version that outputs $username, e.g. 
<div id="reply-<?php print $reply->id ?>" class="<?php print $classes ?>">
  <div class="reply-body"><?php print render($content) ?></div>

  <footer class="comment-submitted">
   <?php
      print t('Submitted by !username on !datetime',
      array('!username' => $author, '!datetime' => '<time datetime="' . $datetime . '">' . $created . '</time>'));
    ?>
  </footer>

  <div class="reply-links"><?php print render($links) ?></div>
</div>

Q) Is there an easy way to return the reply count for a particular entity the reply field is attached to?
A) You can do the following:
$instance = field_info_instance($entity_type, $field_name, $bundle_name);
$count = count(reply_get_entity($entity_id, $entity_type, $instance['id']));
