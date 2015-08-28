from ckan.lib.base import _
import ckan.new_authz
import ckan.plugins as p

from ckanext.harvest.model import HarvestSource
from ckanext.harvest.logic.auth import get_job_object, get_obj_object


def auth_allow_anonymous_access(auth_function):
    '''
        Local version of the auth_allow_anonymous_access decorator that only
        calls the actual toolkit decorator if the CKAN version supports it
    '''
    if p.toolkit.check_ckan_version(min_version='2.2'):
        auth_function = p.toolkit.auth_allow_anonymous_access(auth_function)

    return auth_function


@auth_allow_anonymous_access
def harvest_source_show(context, data_dict):
    '''
        Authorization check for getting the details of a harvest source
    '''
    # Public
    return {'success': True}


@auth_allow_anonymous_access
def harvest_source_list(context, data_dict):
    '''
        Authorization check for getting a list of harvest sources

        Everybody can do it
    '''
    return {'success': True}


def harvest_job_show(context,data_dict):
    model = context['model']
    user = context.get('user')

    job = get_job_object(context,data_dict)

    # Check the user is admin/editor for the publisher - i.e. has
    # update_dataset permission
    check1 = ckan.new_authz.has_user_permission_for_group_or_org(
        job.source.publisher_id, user, 'update_dataset'
    )
    if not check1:
        return {'success': False,
                'msg': _('User %s not authorized to read harvest job %s')
                % (str(user), job.id)}
    else:
        return {'success': True}

def harvest_job_list(context,data_dict):
    model = context['model']
    user = context.get('user')

    source_id = data_dict.get('source_id',False)
    if not source_id:
        return {'success': False, 'msg': _('Only sysadmins can list all harvest jobs') % str(user)}

    source = HarvestSource.get(source_id)
    if not source:
        raise p.toolkit.ObjectNotFound

    # Check the user is admin/editor for the publisher - i.e. has
    # update_dataset permission
    check1 = ckan.new_authz.has_user_permission_for_group_or_org(
        source.publisher_id, user, 'update_dataset'
    )
    if not check1:
        return {'success': False, 'msg': _('User %s not authorized to list jobs from source %s') % (str(user),source.id)}

    return {'success': True}

def harvest_object_show(context,data_dict):
    model = context['model']
    user = context.get('user')

    obj = get_obj_object(context,data_dict)

    # Check the user is admin/editor for the publisher - i.e. has
    # update_dataset permission
    check1 = ckan.new_authz.has_user_permission_for_group_or_org(
        obj.source.publisher_id, user, 'update_dataset'
    )
    if not check1:
        return {'success': False, 'msg': _('User %s not authorized to read harvest object %s') % (str(user), obj.id)}
    else:
        return {'success': True}

def harvest_object_list(context,data_dict):
    model = context['model']
    user = context.get('user')

    source_id = data_dict.get('source_id',False)
    if not source_id:
        return {'success': False, 'msg': _('Only sysadmins can list all harvest objects') % str(user)}

    source = HarvestSource.get(source_id)
    if not source:
        raise p.toolkit.ObjectNotFound

    # Check the user is admin/editor for the publisher - i.e. has
    # update_dataset permission
    check1 = ckan.new_authz.has_user_permission_for_group_or_org(
        source.publisher_id, user, 'update_dataset'
    )
    if not check1:
        return {'success': False, 'msg': _('User %s not authorized to list objects from source %s') % (str(user), source.id)}

    return {'success': True}


@auth_allow_anonymous_access
def harvesters_info_show(context,data_dict):
    # Public
    return {'success': True}
