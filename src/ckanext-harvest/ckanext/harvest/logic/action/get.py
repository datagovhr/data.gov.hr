import logging
from sqlalchemy import or_
import ckan.new_authz
from ckan.model import User

from ckan.plugins import PluginImplementations
from ckanext.harvest.interfaces import IHarvester

import ckan.plugins as p
from ckan.logic import NotFound, check_access, side_effect_free

from ckanext.harvest.model import (HarvestSource, HarvestJob, HarvestObject)
from ckanext.harvest.logic.dictization import (harvest_source_dictize,
                                               harvest_job_dictize,
                                               harvest_object_dictize)

log = logging.getLogger(__name__)

@side_effect_free
def harvest_source_show(context,data_dict):
    '''
    Returns the metadata of a harvest source

    This method just proxies the request to package_show. All auth checks and
    validation will be done there.

    :param id: the id or name of the harvest source
    :type id: string

    :returns: harvest source metadata
    :rtype: dictionary
    '''
    check_access('harvest_source_show',context,data_dict)

    id = data_dict.get('id')
    attr = data_dict.get('attr',None)

    source = HarvestSource.get(id,attr=attr)
    context['source'] = source

    if not source:
        raise NotFound

    if 'include_status' not in context:
        context['include_status'] = True

    return harvest_source_dictize(source,context)

@side_effect_free
def harvest_source_list(context, data_dict):

    user = context.get('user')

    check_access('harvest_source_list',context,data_dict)

    sources = _get_sources_for_user(context, data_dict)

    context['detailed'] = False

    return [harvest_source_dictize(source, context) for source in sources]

@side_effect_free
def harvest_source_for_a_dataset(context, data_dict):
    '''For a given dataset, return the harvest source that
    created or last updated it, otherwise NotFound.'''

    model = context['model']
    session = context['session']

    dataset_id = data_dict.get('id')

    query = session.query(HarvestSource)\
            .join(HarvestObject)\
            .filter_by(package_id=dataset_id)\
            .order_by(HarvestObject.gathered.desc())
    source = query.first() # newest

    if not source:
        raise NotFound

    if not context.get('include_status'):
        # By default we don't want to know the harvest
        # source status - this is an expensive call.
        context['include_status'] = False
    return harvest_source_dictize(source, context)

@side_effect_free
def harvest_job_show(context,data_dict):

    check_access('harvest_job_show',context,data_dict)

    id = data_dict.get('id')
    attr = data_dict.get('attr',None)

    job = HarvestJob.get(id,attr=attr)
    if not job:
        raise NotFound

    return harvest_job_dictize(job,context)

@side_effect_free
def harvest_job_list(context,data_dict):
    '''Returns a list of jobs and details of objects and errors.
    There is a hard limit of 100 results.

    :param status: filter by e.g. "New" or "Finished" jobs
    :param source_id: filter by a harvest source
    :param offset: paging
    '''

    check_access('harvest_job_list',context,data_dict)

    model = context['model']
    session = context['session']

    source_id = data_dict.get('source_id',False)
    status = data_dict.get('status',False)
    offset = data_dict.get('offset', 0)

    query = session.query(HarvestJob)

    if source_id:
        query = query.filter(HarvestJob.source_id==source_id)

    if status:
        query = query.filter(HarvestJob.status==status)

    # Have a max for safety
    query = query.offset(offset).limit(100)

    jobs = query.all()

    return [harvest_job_dictize(job,context) for job in jobs]

@side_effect_free
def harvest_object_show(context,data_dict):
    check_access('harvest_object_show',context,data_dict)

    id = data_dict.get('id')
    attr = data_dict.get('attr',None)
    obj = HarvestObject.get(id,attr=attr)
    if not obj:
        raise NotFound

    return harvest_object_dictize(obj,context)

@side_effect_free
def harvest_object_list(context,data_dict):

    check_access('harvest_object_list',context,data_dict)

    model = context['model']
    session = context['session']

    only_current = data_dict.get('only_current',True)
    source_id = data_dict.get('source_id',False)

    query = session.query(HarvestObject)

    if source_id:
        query = query.filter(HarvestObject.source_id==source_id)

    if only_current:
        query = query.filter(HarvestObject.current==True)

    objects = query.all()

    return [getattr(obj,'id') for obj in objects]

@side_effect_free
def harvesters_info_show(context,data_dict):
    '''Returns details of the installed harvesters.'''
    check_access('harvesters_info_show',context,data_dict)

    available_harvesters = []
    for harvester in PluginImplementations(IHarvester):
        info = harvester.info()
        if not info or 'name' not in info:
            log.error('Harvester %r does not provide the harvester name in the info response' % str(harvester))
            continue
        info['show_config'] = (info.get('form_config_interface','') == 'Text')
        available_harvesters.append(info)

    return available_harvesters

def _get_sources_for_user(context,data_dict):

    model = context['model']
    session = context['session']
    user = context.get('user','')

    only_mine = data_dict.get('only_mine', False)
    only_active = data_dict.get('only_active',False)
    only_organization = data_dict.get('organization') or data_dict.get('group')

    query = session.query(HarvestSource) \
                .order_by(HarvestSource.created.desc())

    if only_active:
        query = query.filter(HarvestSource.active==True) \

    if only_mine:
        # filter to only harvest sources from this user's organizations
        user_obj = User.get(user)

        publisher_filters = []
        publishers_for_the_user = user_obj.get_groups(u'organization')
        for publisher_id in [g.id for g in publishers_for_the_user]:
            publisher_filters.append(HarvestSource.publisher_id==publisher_id)

        if len(publisher_filters):
            query = query.filter(or_(*publisher_filters))
        else:
            # This user does not belong to a publisher yet, no sources for him/her
            return []

        log.debug('User %s with publishers %r has Harvest Sources: %r',
                  user, publishers_for_the_user, [(hs.id, hs.url) for hs in query])

    if only_organization:
        org = model.Group.get(only_organization)
        if not org:
            raise p.toolkit.ObjectNotFound('Could not find: %s' % only_organization)
        query = query.filter(HarvestSource.publisher_id==org.id)

    sources = query.all()

    return sources

