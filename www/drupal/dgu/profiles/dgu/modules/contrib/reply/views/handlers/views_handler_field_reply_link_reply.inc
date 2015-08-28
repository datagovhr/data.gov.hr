<?php
/**
 * Field handler to present a link to reply to the reply.
 *
 * @ingroup views_field_handlers
 */
class views_handler_field_reply_link_reply extends views_handler_field_reply_link {
  
  /**
   * Renders the link.
   */
  function render_link($reply, $values) {
    // Ensure user has access to reply to this reply.
    if (!reply_access('reply', $reply)) {
      return;
    }

    $this->options['alter']['make_link'] = TRUE;
    $this->options['alter']['path'] = 'reply/add/'. $reply->entity_id .'/'. $reply->instance_id .'/'. $reply->id;
    $this->options['alter']['query'] = drupal_get_destination();

    $text = !empty($this->options['text']) ? $this->options['text'] : t('Reply');
    return $text;
  }
}
