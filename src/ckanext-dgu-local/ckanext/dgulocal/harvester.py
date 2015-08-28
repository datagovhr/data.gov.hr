import logging
import re

import requests

from ckan.plugins.core import implements
from ckan import model
import ckanext.dgu.lib.theme as dgutheme
from ckanext.dgulocal.lib.inventory import InventoryDocument, InventoryXmlError
from ckanext.harvest.model import (HarvestJob, HarvestObject,
                                   HarvestObjectExtra as HOExtra)
from ckanext.harvest.interfaces import IHarvester
from ckanext.harvest.harvesters.base import HarvesterBase
from ckanext.dgulocal.lib.geo import get_boundary
from ckanext.dgu.lib.formats import Formats

log = logging.getLogger(__name__)

SCHEMA_TYPE_MAP = {
    'CSV': 'csvlint',
    'XML': 'xsd',
    }


class InventoryHarvester(HarvesterBase):
    '''
    Harvesting of LGA Inventories from a single XML document provided at a
    URL.
    '''
    implements(IHarvester)

    IDENTIFIER_KEY = 'inventory_identifier'

    def info(self):
        '''
        Returns a descriptor with information about the harvester.
        '''
        return {
                "name": "inventory",
                "title": "Inventory XML",
                "description": "Dataset metadata published according to the Inventory XML format: http://schemas.opendata.esd.org.uk/Inventory with XSD: https://github.com/datagovuk/ckanext-dgu-local/blob/master/ckanext/dgulocal/data/inventory.xsd"
            }

    def gather_stage(self, harvest_job):
        '''
        Fetches the single inventory document containing all of the
        datasets to be created/modified.

        :param harvest_job: HarvestJob object
        :returns: A list of HarvestObject ids
        '''
        self.last_run = None

        log.debug('Resolving source: %s', harvest_job.source.url)
        try:
            req = requests.get(harvest_job.source.url)
            e = req.raise_for_status()
            if e:
                raise e
        except requests.exceptions.RequestException, e:
            # e.g. requests.exceptions.ConnectionError
            self.save_gather_error('Failed to get content from URL: %s Error:%s %s' %
                             (harvest_job.source.url, e.__class__.__name__, e),
                             harvest_job)
            return None

        try:
            doc = InventoryDocument(req.content)
        except InventoryXmlError, e:
            self.save_gather_error('Failed to parse or validate the XML document: %s %s' %
                             (e.__class__.__name__, e), harvest_job)
            return None

        doc_metadata = doc.top_level_metadata()

        # TODO: Somehow update the publisher details with the geo boundary
        spatial_coverage_url = doc_metadata.get('spatial-coverage-url')
        if spatial_coverage_url:
            boundary = get_boundary(spatial_coverage_url)
            if boundary:
                # don't import dgulocal_model until here, to allow tests that
                # don't need postgis to run under sqlite
                from ckanext.dgulocal import model as dgulocal_model
                try:
                    dgulocal_model.set_organization_polygon(
                            harvest_job.source.publisher_id,
                            boundary)
                except Exception, e:
                    log.exception(e)
                    # but carry on anyway?

        # Find any previous harvests and store. If modified since then continue
        # otherwise bail. Store the last process date so we can check the
        # datasets
        doc_last_modified = doc_metadata['modified']
        previous = model.Session.query(HarvestJob)\
            .filter(HarvestJob.source_id==harvest_job.source_id)\
            .filter(HarvestJob.status!='New')\
            .order_by("gather_finished desc").first()
        if previous and previous.gather_finished:
            # Skip the harvest if we are sure the metadata is unchanged since
            # the last run.
            # i.e.
            # 1. the last_modified is filled in
            # 2. AND last_modified was the older that the last run (can't be
            # the same as it could be changed at a later time than the last
            # run, and the time of the modification is not in the Inventory
            # XML)
            self.last_run = previous.gather_finished
            if doc_last_modified \
                    and doc_last_modified < self.last_run.date():
                log.info("Not modified {0} since last run on {1}".format(doc_last_modified, self.last_run.date()))
                return None

        # We create a new HarvestObject for each inv:Dataset within the
        # Inventory document
        ids = []
        for dataset_node in doc.dataset_nodes():
            dataset = doc.dataset_to_dict(dataset_node)
            guid = self.build_guid(doc_metadata['identifier'], dataset['identifier'])
            # Use the most recent modification date out of the doc and dataset,
            # since they might have forgotten to enter or update the dataset
            # date.
            dataset_last_modified = dataset['modified'] or doc_last_modified
            if dataset_last_modified and doc_last_modified:
                dataset_last_modified = max(dataset_last_modified, doc_last_modified)
            if previous:
                # object may be in the previous harvest, or an older one
                existing_object = model.Session.query(HarvestObject)\
                                       .filter_by(guid=guid)\
                                       .filter_by(current=True)\
                                       .first()
                if not existing_object:
                    status = 'new'
                elif (not existing_object.metadata_modified_date) or \
                        existing_object.metadata_modified_date.date() < dataset_last_modified:
                    status = 'changed'
                else:
                    log.debug('Dataset unchanged: %s this="%s" previous="%s"',
                              dataset['title'], dataset_last_modified,
                              existing_object.metadata_modified_date)
                    continue
            else:
                status = 'new'
            obj = HarvestObject(guid=guid,
                                job=harvest_job,
                                content=doc.serialize_node(dataset_node),
                                harvest_source_reference=guid,
                                metadata_modified_date=dataset_last_modified,
                                extras=[HOExtra(key='status', value=status)],
                                )
            obj.save()
            ids.append(obj.id)

        return ids

    def fetch_stage(self, harvest_object):
        '''
        Check that we have content from the gather stage and just return
        success
        :returns: True if everything went right, False if errors were found
        '''
        # There is no fetching because all the content for the objects were got
        # in one request during the gather stage.
        return bool(harvest_object.content)

    @classmethod
    def build_guid(cls, doc_identifier, dataset_identifier):
        assert doc_identifier  # e.g. http://redbridge.gov.uk/
        assert dataset_identifier  # e.g. river-levels
        return '%s/%s' % (doc_identifier, dataset_identifier)

    def get_package_dict(self, harvest_object, package_dict_defaults,
                         source_config, existing_dataset):
        '''
        Constructs a package_dict suitable to be passed to package_create or
        package_update. See documentation on
        ckan.logic.action.create.package_create for more details

        * name - a new package must have a unique name; if it had a name in the
          previous harvest, that will be in the package_dict_defaults.
        * resource.id - should be the same as the old object if updating a
          package
        * errors - call self._save_object_error() and return False
        * default values for name, owner_org, tags etc can be merged in using:
            package_dict = package_dict_defaults.merge(package_dict_harvested)
        '''
        inv_dataset = InventoryDocument.dataset_to_dict(
                       InventoryDocument.parse_xml_string(harvest_object.content)
                       )

        pkg = dict(
            title=inv_dataset['title'],
            notes=inv_dataset['description'],
            state='active' if inv_dataset['active'] else 'deleted',
            resources=[],
            extras={self.IDENTIFIER_KEY: inv_dataset['identifier'],
                    'harvest_source_reference': harvest_object.guid
                    }
            )
        # License
        rights = inv_dataset.get('rights')
        if rights:
            register = model.Package.get_license_register()
            if rights == 'http://www.nationalarchives.gov.uk/doc/open-government-licence/':
                pkg['license_id'] = 'uk-ogl'
            else:
                for l in register.values():
                    if l.url == rights:
                        pkg['license_id'] = l.id
                        break
                else:
                    # just save it as it is
                    pkg['license_id'] = register
                    log.info('Did not recognize license %r', register)
        else:
            pkg['license_id'] = None

        # Resources
        inv_resources = [r for r in inv_dataset['resources'] if r['active']]
        existing_resource_urls = dict((r.url, r.id)
                                      for r in existing_dataset.resources) \
                                 if existing_dataset else {}
        pkg['resources'] = []
        for inv_resource in inv_resources:
            format_ = Formats.by_mime_type().get(inv_resource['mimetype'])
            if format_:
                format_ = format_['display_name']
            else:
                format_ = inv_resource['mimetype']
            description = inv_resource['title']
            if inv_resource['availability']:
                description += ' - %s' % inv_resource['availability']
            # if it is temporal, it should be a timeseries,
            # if it is not data, it should be an additional resource
            resource_type = 'file' if inv_resource['resource_type'] == 'Data' \
                else 'documentation'
            # Schema
            if inv_resource['conforms_to']:
                schema_url = inv_resource['conforms_to']
                schema_type = SCHEMA_TYPE_MAP.get(format_)
            else:
                schema_url = schema_type = ''
            res = {'url': inv_resource['url'],
                   'format': format_,
                   'description': description,
                   'resource_type': resource_type,
                   'schema-url': schema_url,
                   'schema-type': schema_type,
                   }
            if res['url'] in existing_resource_urls:
                res['id'] = existing_resource_urls[res['url']]
            pkg['resources'].append(res)

        # LGA Services and Functions
        if inv_dataset['services']:
            log.info('LGA Services: %r', inv_dataset['services'])
            # e.g. {http://id.esd.org.uk/service/190}
            pkg['extras']['lga_services'] = ' '.join(inv_dataset['services'])
        else:
            pkg['extras']['lga_services'] = ''
        if inv_dataset['functions']:
            log.info('LGA Functions %r', inv_dataset['functions'])
            pkg['extras']['lga_functions'] = ' '.join(inv_dataset['functions'])
        else:
            pkg['extras']['lga_functions'] = ''

        pkg = package_dict_defaults.merge(pkg)
        if not pkg.get('name'):
            # append the publisher name to differentiate similar titles better
            # than just a numbers suffix
            publisher = model.Group.get(harvest_object.job.source.publisher_id)
            publisher_abbrev = self._get_publisher_abbreviation(publisher)
            pkg['name'] = self.check_name(self.munge_title_to_name(
                '%s %s' % (pkg['title'], publisher_abbrev)))

        # Themes based on services/functions
        if 'tags' not in pkg:
            pkg['tags'] = []
        themes = dgutheme.categorize_package(pkg)
        log.debug('%s given themes: %r', pkg['name'], themes)
        if themes:
            pkg['extras'][dgutheme.PRIMARY_THEME] = themes[0]
            if len(themes) == 2:
                pkg['extras'][dgutheme.SECONDARY_THEMES] = '["%s"]' % themes[1]

        pkg['extras'] = self.extras_from_dict(pkg['extras'])
        return pkg

    @staticmethod
    def _get_publisher_abbreviation(publisher):
        abbrev = publisher.extras.get('abbreviation')
        if not abbrev:
            # Just look for capital letters
            abbrev = re.sub('[^A-Z]', '', publisher.title)
        return abbrev
