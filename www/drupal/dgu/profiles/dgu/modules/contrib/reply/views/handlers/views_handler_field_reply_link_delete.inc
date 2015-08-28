<?php
/**
 * Field handler to present a link reply delete.
 *
 * @ingroup views_field_handlers
 */
class views_handler_field_reply_link_delete extends views_handler_field_reply_link {
  
  /**
   * Renders the link.
   */
  function render_link($reply, $values) {
    // Ensure user has access to edit this reply.
    if (!reply_access('delete', $reply)) {
      return;
    }

    $this->options['alter']['make_link'] = TRUE;
    $this->options['alter']['path'] = "reply/$reply->id/delete";
    $this->options['alter']['query'] = drupal_get_destination();

    $text = !empty($this->options['text']) ? $this->options['text'] : t('Delete');
    return $text;
  }
}
