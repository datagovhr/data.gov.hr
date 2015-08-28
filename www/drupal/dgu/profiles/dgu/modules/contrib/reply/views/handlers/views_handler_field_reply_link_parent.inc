<?php
/**
 * Field handler to present a link to reply to the reply.
 *
 * @ingroup views_field_handlers
 */
class views_handler_field_reply_link_parent extends views_handler_field_reply_link {

  /**
   * Renders the link.
   */
  function render_link($reply, $values) {

    $this->options['alter']['make_link'] = TRUE;
    $this->options['alter']['path'] = $reply->entity_type . '/'. $reply->entity_id;
    $this->options['alter']['query'] = drupal_get_destination();

    if ($entity = entity_load_single($reply->entity_type, $reply->entity_id)) {
      return entity_label($reply->entity_type, $entity);
    }
    else {
      return 'Missing parent entity';
    }

  }
}
