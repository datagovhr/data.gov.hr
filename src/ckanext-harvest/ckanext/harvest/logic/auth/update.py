import ckan.new_authz
import ckan.plugins as p

from ckanext.harvest.logic.auth import get_source_object
from ckanext.harvest.model import HarvestSource

_ = p.toolkit._


def harvest_source_update(context, data_dict):
    #model = context['model']
    user = context.get('user', '')

    source = get_source_object(context, data_dict)

    # Check the user is admin/editor for the publisher - i.e. has
    # update_dataset permission
    check1 = ckan.new_authz.has_user_permission_for_group_or_org(
        source.publisher_id, user, 'update_dataset'
    )
    if not check1:
        return {'success': False,
                'msg': _('User %s not authorized to update harvest source %s')
                       % (str(user), source.id)}
    return {'success': True}


def harvest_objects_import(context, data_dict):
    #model = context['model']
    user = context.get('user')

    source_id = data_dict.get('source_id', False)
    if not source_id:
        return {'success': False, 'msg': _('Only sysadmins can reimport all harvest objects') % str(user)}

    source = HarvestSource.get(source_id)
    if not source:
        raise p.toolkit.ObjectNotFound

    # Check the user is admin/editor for the publisher - i.e. has
    # update_dataset permission
    check1 = ckan.new_authz.has_user_permission_for_group_or_org(
        source.publisher_id, user, 'update_dataset'
    )
    if not check1:
        return {'success': False,
                'msg': _('User %s not authorized to reimport objects from source %s')
                % (str(user), source.id)}

    return {'success': True}


def harvest_jobs_run(context, data_dict):
    #model = context['model']
    user = context.get('user')

    source_id = data_dict.get('source_id', False)
    if not source_id:
        return {'success': False, 'msg': _('Only sysadmins can run all harvest jobs') % str(user)}

    source = HarvestSource.get(source_id)
    if not source:
        raise p.toolkit.ObjectNotFound

    # Check the user is admin/editor for the publisher - i.e. has
    # update_dataset permission
    check1 = ckan.new_authz.has_user_permission_for_group_or_org(
        source.publisher_id, user, 'update_dataset'
    )
    if not check1:
        return {'success': False, 'msg': _('User %s not authorized to run jobs from source %s') % (str(user),source.id)}

    return {'success': True}
