from datetime import datetime, date
import lxml
import logging
import os

from nose.tools import assert_equal, assert_in

from ckan import plugins
from ckan.lib.base import config
from ckan.lib.create_test_data import CreateTestData
from ckan.lib.helpers import get_pkg_dict_extra
from ckan import model
from ckan.model import Session,Package
from ckan.logic.schema import default_update_package_schema
from ckan.logic import get_action
from ckanext.harvest.model import (setup as harvest_model_setup,
                                   HarvestSource, HarvestJob, HarvestObject,
                                   HarvestCoupledResource, HarvestGatherError)
from ckanext.spatial.validation import Validators, SchematronValidator
from ckanext.spatial.harvesters import (GeminiCswHarvester, GeminiDocHarvester,
                                        GeminiWafHarvester, SpatialHarvester,
                                        GeminiHarvester)
from ckanext.spatial.model.package_extent import setup as spatial_db_setup
from ckanext.spatial.tests.base import SpatialTestBase

from xml_file_server import serve

xml_directory = os.path.join(os.path.dirname(__file__), 'xml')
is_publisher_profile = True #config.get('ckan.harvest.auth.profile') == 'publisher'

class HarvestFixtureBase(SpatialTestBase):

    serving = False

    @classmethod
    def setup_class(cls):
        SpatialTestBase.setup_class()

        # Start simple HTTP server that serves XML test files
        if not HarvestFixtureBase.serving:
            serve()
            HarvestFixtureBase.serving = True
            # gets shutdown when nose finishes all tests,
            # so don't restart ever

    def setup(self):
        # Add sysadmin user
        harvest_user = model.User(name=u'harvest', password=u'test')
        harvest_user.sysadmin = True
        Session.add(harvest_user)
        Session.commit()

        package_schema = default_update_package_schema()
        self.context ={'model':model,
                       'session':Session,
                       'user':u'harvest',
                       'schema':package_schema,
                       'api_version': '2'}

        if is_publisher_profile:
            # Create a publisher and user
            self.publisher, self.publisher_user = \
                    self._create_publisher_and_user('test-publisher', 'test-publisher-user')
            self.publisher2, self.publisher_user2 = \
                    self._create_publisher_and_user('test-publisher2', 'test-publisher-user2')

    def _create_publisher_and_user(self, publisher_name, user_name):
        CreateTestData.create_user(name=user_name, password='test')
        CreateTestData.create_groups([
            {'name': publisher_name,
             'title': publisher_name.capitalize(),
             'type': 'organization',
             'is_organization': True,
             'admins': [user_name],
            }])
        publisher = model.Group.get(publisher_name)
        assert publisher
        user = model.User.get(user_name)
        assert user
        return publisher, user

    def teardown(self):
       model.repo.rebuild_db()

    def _create_job(self,source_id):
        # Create a job
        context ={'model':model,
                 'session':Session,
                 'user':u'harvest'}

        job_dict=get_action('harvest_job_create')(context,{'source_id':source_id})
        job = HarvestJob.get(job_dict['id'])
        assert job

        return job

    def _create_source_and_job(self, source_fixture):
        context ={'model':model,
                 'session':Session,
                 'user':u'harvest'}

        if is_publisher_profile \
           and not 'publisher_id' in source_fixture:
           source_fixture['publisher_id'] = self.publisher.id

        source_dict=get_action('harvest_source_create')(context,source_fixture)
        source = HarvestSource.get(source_dict['id'])
        assert source

        job = self._create_job(source.id)

        return source, job

    def _run_job_for_single_document(self,job,force_import=False,expect_gather_errors=False,expect_obj_errors=False):

        harvester = GeminiDocHarvester()

        harvester.force_import = force_import


        object_ids = harvester.gather_stage(job)
        assert object_ids, len(object_ids) == 1
        if expect_gather_errors:
            assert len(job.gather_errors) > 0
        else:
            assert len(job.gather_errors) == 0

        assert harvester.fetch_stage(object_ids) == True

        obj = HarvestObject.get(object_ids[0])
        assert obj, obj.content

        harvester.import_stage(obj)
        Session.refresh(obj)
        if expect_obj_errors:
            assert len(obj.errors) > 0
        else:
            assert len(obj.errors) == 0, obj.errors

        job.status = u'Finished'
        job.save()

        return obj

class TestHarvest(HarvestFixtureBase):

    @classmethod
    def setup_class(cls):
        SpatialHarvester._validator = Validators(profiles=['gemini2'])
        HarvestFixtureBase.setup_class()

    def test_harvest_basic(self):

        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1-waf/index.html',
            'type': u'gemini-waf'
        }

        source, job = self._create_source_and_job(source_fixture)

        harvester = GeminiWafHarvester()

        # We need to send an actual job, not the dict
        object_ids = harvester.gather_stage(job)

        assert len(object_ids) == 2

        # Fetch stage always returns True for Waf harvesters
        assert harvester.fetch_stage(object_ids) == True

        objects = []
        for object_id in object_ids:
            obj = HarvestObject.get(object_id)
            assert obj
            objects.append(obj)
            harvester.import_stage(obj)

        pkgs = Session.query(Package).all()

        assert_equal(len(pkgs), 2)

        pkg_ids = [pkg.id for pkg in pkgs]

        for obj in objects:
            assert obj.current == True
            assert obj.package_id in pkg_ids

    def test_harvest_fields_service(self):

        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/service1.xml',
            'type': u'gemini-single'
        }

        source, job = self._create_source_and_job(source_fixture)

        harvester = GeminiDocHarvester()

        object_ids = harvester.gather_stage(job)
        assert object_ids, len(object_ids) == 1

        # No gather errors
        assert len(job.gather_errors) == 0

        # Fetch stage always returns True for Single Doc harvesters
        assert harvester.fetch_stage(object_ids) == True

        obj = HarvestObject.get(object_ids[0])
        assert obj, obj.content
        assert obj.guid == u'test-service-1'

        harvester.import_stage(obj)

        # No object errors
        assert len(obj.errors) == 0

        package_dict = get_action('package_show_rest')(self.context,{'id':obj.package_id})

        assert package_dict

        expected = {
            'name': u'one-scotland-address-gazetteer-web-map-service-wms',
            'title': u'One Scotland Address Gazetteer Web Map Service (WMS)',
            'tags': [u'Addresses', u'Scottish National Gazetteer'],
            'notes': u'This service displays its contents at larger scale than 1:10000. [edited]',
        }

        for key,value in expected.iteritems():
            if not package_dict[key] == value:
                raise AssertionError('Unexpected value for %s: %s (was expecting %s)' % \
                    (key, package_dict[key], value))

        if is_publisher_profile:
            assert_equal(package_dict['owner_org'], self.publisher.id)

        expected_extras = {
            # Basic
            'harvest_object_id': obj.id,
            'guid': obj.guid,
            'UKLP': u'True',
            'resource-type': u'service',
            'access_constraints': u'["No restriction on public access"]',
            'responsible-party': u'The Improvement Service (owner)',
            'provider':u'The Improvement Service',
            'contact-email': u'OSGCM@improvementservice.org.uk',
            # Spatial
            'bbox-east-long': u'0.5242365625',
            'bbox-north-lat': u'61.0243',
            'bbox-south-lat': u'54.4764484375',
            'bbox-west-long': u'-9.099786875',
            'spatial': u'{"type":"Polygon","coordinates":[[[0.5242365625, 54.4764484375],[0.5242365625, 61.0243], [-9.099786875, 61.0243], [-9.099786875, 54.4764484375], [0.5242365625, 54.4764484375]]]}',
            # Other
            'coupled-resource': u'[{"href": ["http://scotgovsdi.edina.ac.uk/srv/en/csw?service=CSW&request=GetRecordById&version=2.0.2&outputSchema=http://www.isotc211.org/2005/gmd&elementSetName=full&id=250ea276-48e2-4189-8a89-fcc4ca92d652"], "uuid": ["250ea276-48e2-4189-8a89-fcc4ca92d652"], "title": []}]',
            'dataset-reference-date': u'[{"type": "publication", "value": "2011-09-08"}]',
            'frequency-of-update': u'daily',
            'licence': u'["Use of the One Scotland Gazetteer data used by this this service is available to any organisation that is a member of the One Scotland Mapping Agreement. It is not currently commercially available"]',
            'licence_url': u'http://www.test.gov.uk/licenseurl',
            'metadata-date': u'2011-09-08',
            'metadata-language': u'eng',
            'spatial-data-service-type': u'other',
            'spatial-reference-system': u'OSGB 1936 / British National Grid (EPSG:27700)',
            'temporal_coverage-from': u'["1904-06-16"]',
            'temporal_coverage-to': u'["2004-06-16"]',
            'theme-primary': 'Mapping',
            'themes-secondary': '["Environment"]',
        }

        for key,value in expected_extras.iteritems():
            if not key in package_dict['extras']:
                raise AssertionError('Extra %s not present in package' % key)

            if not package_dict['extras'][key] == value:
                raise AssertionError('Unexpected value for extra %s: %s (was expecting %s)' % \
                    (key, package_dict['extras'][key], value))

        # Much of this depends on the particular WMS server working...
        expected_resource = {
            #'ckan_recommended_wms_preview': 'True',
            'description': 'Link to the GetCapabilities request for this service',
            #'format': 'WMS',
            'name': 'Web Map Service (WMS)',
            'resource_locator_function': 'download',
            'resource_locator_protocol': 'OGC:WMS-1.3.0-http-get-capabilities',
            'resource_type': None,
            'size': None,
            'url': u'http://sedsh13.sedsh.gov.uk/ArcGIS/services/OSG/OSG/MapServer/WMSServer?request=GetCapabilities&service=WMS',
            #'verified': 'True',
        }

        resource = package_dict['resources'][0]
        for key,value in expected_resource.iteritems():
            if not resource[key] == value:
                raise AssertionError('Unexpected value in resource for %s: %s (was expecting %s)' % \
                    (key, resource[key], value))
        #assert datetime.strptime(resource['verified_date'],'%Y-%m-%dT%H:%M:%S.%f').date() == date.today()

        # See that the coupled resources are created (half of the link)
        coupled_resources = self._get_coupled_resources()
        assert_equal(coupled_resources,
                     set([(u'one-scotland-address-gazetteer-web-map-service-wms', '250ea276-48e2-4189-8a89-fcc4ca92d652', None)]))

    def _get_coupled_resources(self):
        return set([(couple.service_record.name if couple.service_record else None,
                     couple.harvest_source_reference,
                     couple.dataset_record.name if couple.dataset_record else None)\
                    for couple in model.Session.query(HarvestCoupledResource)])

    def test_harvest_fields_dataset(self):

        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/dataset1.xml',
            'type': u'gemini-single'
        }

        source, job = self._create_source_and_job(source_fixture)

        harvester = GeminiDocHarvester()

        object_ids = harvester.gather_stage(job)
        assert object_ids, len(object_ids) == 1

        # No gather errors
        assert len(job.gather_errors) == 0

        # Fetch stage always returns True for Single Doc harvesters
        assert harvester.fetch_stage(object_ids) == True

        obj = HarvestObject.get(object_ids[0])
        assert obj, obj.content
        assert obj.guid == u'test-dataset-1'

        harvester.import_stage(obj)

        # No object errors
        assert len(obj.errors) == 0, obj.errors

        package_dict = get_action('package_show_rest')(self.context,{'id':obj.package_id})

        assert package_dict

        expected = {
            'name': u'country-parks-scotland',
            'title': u'Country Parks (Scotland)',
            'tags': [u'Nature conservation'],
            'notes': u'Parks are set up by Local Authorities to provide open-air recreation facilities close to towns and cities. [edited]'
        }

        for key,value in expected.iteritems():
            if not package_dict[key] == value:
                raise AssertionError('Unexpected value for %s: %s (was expecting %s)' % \
                    (key, package_dict[key], value))

        if is_publisher_profile:
            assert_equal(package_dict['owner_org'], self.publisher.id)

        expected_extras = {
            # Basic
            'harvest_object_id': obj.id,
            'guid': obj.guid,
            'resource-type': u'dataset',
            'responsible-party': u'Scottish Natural Heritage (custodian, distributor)',
            'access_constraints': u'["Copyright Scottish Natural Heritage"]',
            'contact-email': u'data_supply@snh.gov.uk',
            'provider':'',
            # Spatial
            'bbox-east-long': u'0.205857204',
            'bbox-north-lat': u'61.06066944',
            'bbox-south-lat': u'54.529947158',
            'bbox-west-long': u'-8.97114288',
            'spatial': u'{"type":"Polygon","coordinates":[[[0.205857204, 54.529947158],[0.205857204, 61.06066944], [-8.97114288, 61.06066944], [-8.97114288, 54.529947158], [0.205857204, 54.529947158]]]}',
            # Other
            'coupled-resource': u'[]',
            'dataset-reference-date': u'[{"type": "creation", "value": "2004-02"}, {"type": "revision", "value": "2006-07-03"}]',
            'frequency-of-update': u'irregular',
            'licence': u'["Reference and PSMA Only", "copyright", "otherRestrictions"]',
            'licence_url': u'http://www.test.gov.uk/licenseurl',
            'metadata-date': u'2011-09-23',
            'metadata-language': u'eng',
            'spatial-reference-system': u'urn:ogc:def:crs:EPSG::27700',
            'temporal_coverage-from': u'["1998"]',
            'temporal_coverage-to': u'["2010"]',
        }

        for key,value in expected_extras.iteritems():
            if not key in package_dict['extras']:
                raise AssertionError('Extra %s not present in package' % key)

            if not package_dict['extras'][key] == value:
                raise AssertionError('Unexpected value for extra %s: %r (was expecting %r)' % \
                    (key, package_dict['extras'][key], value))

        expected_resource = {
            'description': 'Test Resource Description',
            'format': u'',
            'name': 'Test Resource Name',
            'resource_locator_function': 'download',
            'resource_locator_protocol': 'test-protocol',
            'resource_type': None,
            'size': None,
            'url': u'https://gateway.snh.gov.uk/pls/apex_ddtdb2/f?p=101',
        }

        resource = package_dict['resources'][0]
        for key,value in expected_resource.iteritems():
            if not resource[key] == value:
                raise AssertionError('Unexpected value in resource for %s: %s (was expecting %s)' % \
                    (key, resource[key], value))

    def test_harvest_error_bad_xml(self):
        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/error_bad_xml.xml',
            'type': u'gemini-single'
        }

        source, job = self._create_source_and_job(source_fixture)

        harvester = GeminiDocHarvester()

        try:
            object_ids = harvester.gather_stage(job)
        except lxml.etree.XMLSyntaxError:
            # this only occurs in debug_exception_mode
            pass
        else:
            assert object_ids is None

        # Check gather errors
        assert_equal(len(job.gather_errors), 2)
        assert job.gather_errors[0].harvest_job_id == job.id
        assert job.gather_errors[1].harvest_job_id == job.id
        assert_equal(job.gather_errors[0].message, 'Content is not a valid XML document (http://127.0.0.1:8999/gemini2.1/error_bad_xml.xml): Premature end of data in tag MD_Metadata line 2, line 16, column 1')

    def test_harvest_error_connection(self):
        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:123456/wrong_port',
            'type': u'gemini-single'
        }

        source, job = self._create_source_and_job(source_fixture)

        harvester = GeminiDocHarvester()

        object_ids = harvester.gather_stage(job)
        assert object_ids is None

        # Check gather errors
        assert len(job.gather_errors) == 1
        assert job.gather_errors[0].harvest_job_id == job.id
        assert_in('could not make connection', job.gather_errors[0].message)
        assert_in('Connection refused', job.gather_errors[0].message)

    def test_harvest_error_bad_status(self):
        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/not_there',
            'type': u'gemini-single'
        }

        source, job = self._create_source_and_job(source_fixture)

        harvester = GeminiDocHarvester()

        object_ids = harvester.gather_stage(job)
        assert object_ids is None

        # Check gather errors
        assert len(job.gather_errors) == 1
        assert job.gather_errors[0].harvest_job_id == job.id
        assert_in('Server responded with an error', job.gather_errors[0].message)
        assert_in('404', job.gather_errors[0].message)
        assert_in('File not found', job.gather_errors[0].message)

    def test_harvest_error_validation(self):

        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/error_validation.xml',
            'type': u'gemini-single'
        }

        source, job = self._create_source_and_job(source_fixture)

        harvester = GeminiDocHarvester()

        object_ids = harvester.gather_stage(job)

        # Right now the import process goes ahead even with validation errors
        assert object_ids, len(object_ids) == 1

        # No gather errors
        assert len(job.gather_errors) == 0

        # Fetch stage always returns True for Single Doc harvesters
        assert harvester.fetch_stage(object_ids) == True

        obj = HarvestObject.get(object_ids[0])
        assert obj, obj.content
        assert obj.guid == u'test-error-validation-1'

        harvester.import_stage(obj)

        # Check errors
        assert len(obj.errors) == 1
        assert obj.errors[0].harvest_object_id == obj.id

        message = obj.errors[0].message

        assert_in('Validating against "GEMINI 2.1 Schematron 1.2" profile failed', message)
        assert_in('One email address shall be provided', message)
        assert_in('Service type shall be one of \'discovery\', \'view\', \'download\', \'transformation\', \'invoke\' or \'other\' following INSPIRE generic names', message)
        assert_in('Limitations on public access code list value shall be \'otherRestrictions\'', message)
        assert_in('One organisation name shall be provided', message)


    def test_harvest_update_records(self):

        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/dataset1.xml',
            'type': u'gemini-single'
        }

        source, first_job = self._create_source_and_job(source_fixture)

        first_obj = self._run_job_for_single_document(first_job)

        first_package_dict = get_action('package_show')(self.context,{'id':first_obj.package_id})

        # Package was created
        assert first_package_dict
        assert_equal(get_pkg_dict_extra(first_package_dict, 'theme-primary'), 'Towns')
        assert first_obj.current == True
        assert first_obj.package

        # Create and run a second job, the package should not be updated
        second_job = self._create_job(source.id)

        second_obj = self._run_job_for_single_document(second_job)

        Session.remove()
        Session.add(first_obj)
        Session.add(second_obj)

        Session.refresh(first_obj)
        Session.refresh(second_obj)

        second_package_dict = get_action('package_show')(self.context,{'id':first_obj.package_id})

        # Package was not updated
        assert second_package_dict, first_package_dict['id'] == second_package_dict['id']
        assert first_package_dict['metadata_modified'] == second_package_dict['metadata_modified']
        assert not second_obj.package, not second_obj.package_id
        assert second_obj.current == False, first_obj.current == True

        # Change the theme, as if it was changed to a different value manually (by sysadmin)
        for extra in second_package_dict['extras']:
            if extra['key'] == 'theme-primary':
                extra['value'] = 'New Theme'
                break
        else:
            assert 0
        get_action('package_update')(self.context, second_package_dict)
        edited_package_dict = get_action('package_show')(self.context,{'id':first_obj.package_id})
        assert_equal(get_pkg_dict_extra(edited_package_dict, 'theme-primary'), 'New Theme')

        # Create and run a third job, forcing the importing to simulate an update in the package
        third_job = self._create_job(source.id)
        third_obj = self._run_job_for_single_document(third_job,force_import=True)

        # For some reason first_obj does not get updated after the import_stage,
        # and we have to force a refresh to get the actual DB values.
        Session.remove()
        Session.add(first_obj)
        Session.add(second_obj)
        Session.add(third_obj)

        Session.refresh(first_obj)
        Session.refresh(second_obj)
        Session.refresh(third_obj)

        third_package_dict = get_action('package_show_rest')(self.context,{'id':third_obj.package_id})

        # Package was updated
        assert third_package_dict, first_package_dict['id'] == third_package_dict['id']
        assert third_package_dict['metadata_modified'] > second_package_dict['metadata_modified']
        assert third_obj.package, third_obj.package_id == first_package_dict['id']
        assert third_obj.current == True
        assert second_obj.current == False
        assert first_obj.current == False

        # Including the theme. Publishers should use the GEMET INSPIRE Keyword to set theme, not rely on sysadmins.
        edited_package_dict = get_action('package_show')(self.context,{'id':first_obj.package_id})
        assert_equal(get_pkg_dict_extra(edited_package_dict, 'theme-primary'), 'Towns')


    def test_harvest_deleted_record(self):

        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/service1.xml',
            'type': u'gemini-single'
        }

        source, first_job = self._create_source_and_job(source_fixture)

        first_obj = self._run_job_for_single_document(first_job)

        first_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Package was created
        assert first_package_dict
        assert first_package_dict['state'] == u'active'
        assert first_obj.current == True

        # Delete package
        first_package_dict['state'] = u'deleted'
        self.context.update({'id':first_package_dict['id']})
        updated_package_dict = get_action('package_update_rest')(self.context,first_package_dict)

        # Create and run a second job, the date has not changed, so the package should not be updated
        # and remain deleted
        first_job.status = u'Finished'
        first_job.save()
        second_job = self._create_job(source.id)

        second_obj = self._run_job_for_single_document(second_job)

        second_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Package was not updated
        assert second_package_dict, updated_package_dict['id'] == second_package_dict['id']
        assert not second_obj.package, not second_obj.package_id
        assert second_obj.current == False, first_obj.current == True


        # Harvest an updated document, with a more recent modified date, package should be
        # updated and reactivated
        source.url = u'http://127.0.0.1:8999/gemini2.1/service1_newer.xml'
        source.save()

        third_job = self._create_job(source.id)

        third_obj = self._run_job_for_single_document(third_job)

        third_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        Session.remove()
        Session.add(first_obj)
        Session.add(second_obj)
        Session.add(third_obj)

        Session.refresh(first_obj)
        Session.refresh(second_obj)
        Session.refresh(third_obj)

        # Package was updated
        assert third_package_dict, third_package_dict['id'] == second_package_dict['id']
        assert third_obj.package, third_obj.package
        assert third_obj.current == True, second_obj.current == False
        assert first_obj.current == False

        # check it is service1_newer
        assert_equal(third_package_dict['extras']['metadata-date'], '2011-09-10')
        assert third_package_dict['state'] == u'active'



    def test_harvest_different_sources_same_document(self):

        # Create source1
        source1_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/source1/same_dataset.xml',
            'type': u'gemini-single'
        }

        source1, first_job = self._create_source_and_job(source1_fixture)

        first_obj = self._run_job_for_single_document(first_job)

        first_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Package was created
        assert first_package_dict
        assert first_package_dict['state'] == u'active'
        assert first_obj.current == True

        # Harvest the same document, unchanged, from another source, the package
        # is not updated.
        # (As of https://github.com/okfn/ckanext-inspire/commit/9fb67
        # we are no longer throwing an exception when this happens)
        source2_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/source2/same_dataset.xml',
            'type': u'gemini-single'
        }

        source2, second_job = self._create_source_and_job(source2_fixture)

        second_obj = self._run_job_for_single_document(second_job)

        second_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Package was not updated
        assert second_package_dict, first_package_dict['id'] == second_package_dict['id']
        assert first_package_dict['metadata_modified'] == second_package_dict['metadata_modified']
        assert not second_obj.package, not second_obj.package_id
        assert second_obj.current == False, first_obj.current == True


        # Inactivate source1 and reharvest from source2, package should be updated
        third_job = self._create_job(source2.id)
        third_obj = self._run_job_for_single_document(third_job,force_import=True)

        Session.remove()
        Session.add(first_obj)
        Session.add(second_obj)
        Session.add(third_obj)

        Session.refresh(first_obj)
        Session.refresh(second_obj)
        Session.refresh(third_obj)

        third_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Package was updated
        assert third_package_dict, first_package_dict['id'] == third_package_dict['id']
        assert third_package_dict['metadata_modified'] > second_package_dict['metadata_modified']
        assert third_obj.package, third_obj.package_id == first_package_dict['id']
        assert third_obj.current == True
        assert second_obj.current == False
        assert first_obj.current == False


    def test_harvest_different_sources_same_document_but_deleted_inbetween(self):

        # Create source1
        source1_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/source1/same_dataset.xml',
            'type': u'gemini-single'
        }

        source1, first_job = self._create_source_and_job(source1_fixture)

        first_obj = self._run_job_for_single_document(first_job)

        first_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Package was created
        assert first_package_dict
        assert first_package_dict['state'] == u'active'
        assert first_obj.current == True

        # Delete/withdraw the package
        first_package_dict = get_action('package_delete')(self.context,{'id':first_obj.package_id})
        first_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Harvest the same document, unchanged, from another source
        source2_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/source2/same_dataset.xml',
            'type': u'gemini-single'
        }

        source2, second_job = self._create_source_and_job(source2_fixture)

        second_obj = self._run_job_for_single_document(second_job)

        second_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # It would be good if the package was updated, but we see that it isn't
        assert second_package_dict, first_package_dict['id'] == second_package_dict['id']
        assert second_package_dict['metadata_modified'] == first_package_dict['metadata_modified']
        assert not second_obj.package
        assert second_obj.current == False
        assert first_obj.current == True


    def test_harvest_duplicate_guids(self):
        # Create source1
        source1_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/service1.xml',
            'type': u'gemini-single',
            'publisher_id': self.publisher.id,
        }

        source1, first_job = self._create_source_and_job(source1_fixture)

        first_obj = self._run_job_for_single_document(first_job)

        first_package_dict = get_action('package_show')(self.context,{'id':first_obj.package_id})

        # Package was created
        assert first_package_dict
        assert first_package_dict['state'] == u'active'
        assert first_obj.current == True
        assert_equal(first_package_dict['organization']['name'], 'test-publisher')

        # Harvest the same document GUID, DIFFERENT title, from another source.
        # The GUID is clearly copied, so don't allow it.
        source2_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/service1_but_different_title.xml',
            'type': u'gemini-single',
            'publisher_id': self.publisher2.id,
        }

        source2, second_job = self._create_source_and_job(source2_fixture)

        second_obj = self._run_job_for_single_document(second_job, expect_obj_errors=True)
        assert_in('GUIDs must be globally unique', second_obj.errors[0].message)


    def test_harvest_moves_sources(self):

        # Create source1
        source1_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/service1.xml',
            'type': u'gemini-single',
            'publisher_id': self.publisher.id,
        }

        source1, first_job = self._create_source_and_job(source1_fixture)

        first_obj = self._run_job_for_single_document(first_job)

        first_package_dict = get_action('package_show')(self.context,{'id':first_obj.package_id})

        # Package was created
        assert first_package_dict
        assert first_package_dict['state'] == u'active'
        assert first_obj.current == True
        assert_equal(first_package_dict['organization']['name'], 'test-publisher')

        # Harvest the same document GUID but with a newer date, from another source.
        source2_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/service1_duplicate.xml',
            'type': u'gemini-single',
            'publisher_id': self.publisher2.id,
        }

        source2, second_job = self._create_source_and_job(source2_fixture)

        second_obj = self._run_job_for_single_document(second_job)
        second_package_dict = get_action('package_show')(self.context, {'id': first_obj.package_id})

        # The old package has simply changed to the new publisher and name
        assert second_package_dict['id'] == first_package_dict['id']
        assert_equal(second_package_dict['organization']['name'], 'test-publisher2')
        # To move a Gemini record between harvest sources you can just
        # refer to it in a harvest source under the new publisher and reharvest.

    def test_harvest_import_command(self):

        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/dataset1.xml',
            'type': u'gemini-single'
        }

        source, first_job = self._create_source_and_job(source_fixture)

        first_obj = self._run_job_for_single_document(first_job)

        before_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Package was created
        assert before_package_dict
        assert first_obj.current == True
        assert first_obj.package

        # Create and run two more jobs, the package should not be updated
        second_job = self._create_job(source.id)
        second_obj = self._run_job_for_single_document(second_job)
        third_job = self._create_job(source.id)
        third_obj = self._run_job_for_single_document(third_job)

        # Run the import command manually
        imported_objects = get_action('harvest_objects_import')(self.context,{'source_id':source.id})
        Session.remove()
        Session.add(first_obj)
        Session.add(second_obj)
        Session.add(third_obj)

        Session.refresh(first_obj)
        Session.refresh(second_obj)
        Session.refresh(third_obj)

        after_package_dict = get_action('package_show_rest')(self.context,{'id':first_obj.package_id})

        # Package was updated, and the current object remains the same
        assert after_package_dict, before_package_dict['id'] == after_package_dict['id']
        assert after_package_dict['metadata_modified'] > before_package_dict['metadata_modified']
        assert third_obj.current == False
        assert second_obj.current == False
        assert first_obj.current == True


        source_dict = get_action('harvest_source_show')(self.context,{'id':source.id})
        assert len(source_dict['status']['packages']) == 1

    def test_harvest_bad_extent(self):
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/service1_bad_extent.xml',
            'type': u'gemini-single',
        }
        source, job = self._create_source_and_job(source_fixture)
        obj = self._run_job_for_single_document(job, expect_obj_errors=True)
        assert_in('bounding box has zero area', obj.errors[0].message)

BASIC_GEMINI = '''<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco">
  <gmd:fileIdentifier xmlns:gml="http://www.opengis.net/gml">
    <gco:CharacterString>e269743a-cfda-4632-a939-0c8416ae801e</gco:CharacterString>
  </gmd:fileIdentifier>
  <gmd:hierarchyLevel>
    <gmd:MD_ScopeCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/gmxCodelists.xml#MD_ScopeCode" codeListValue="service">service</gmd:MD_ScopeCode>
  </gmd:hierarchyLevel>
</gmd:MD_Metadata>'''
GUID = 'e269743a-cfda-4632-a939-0c8416ae801e'
GEMINI_MISSING_GUID = '''<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco"/>'''

class TestGatherMethods(HarvestFixtureBase):
    def setup(self):
        HarvestFixtureBase.setup(self)
        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/dataset1.xml',
            'type': u'gemini-single'
        }
        source, job = self._create_source_and_job(source_fixture)
        self.harvester = GeminiHarvester()
        self.harvester.harvest_job = job

    def teardown(self):
        model.repo.rebuild_db()

    def get_gather_error(self):
        errs = [err.message for err in self.harvester.harvest_job.gather_errors]
        if len(errs) == 1:
            return errs[0]
        return errs or None

    def test_get_gemini_string_and_guid(self):
        res = self.harvester.get_gemini_string_and_guid(BASIC_GEMINI, url=None)
        assert_equal(res, (BASIC_GEMINI, GUID))

    def test_get_gemini_string_and_guid__no_guid(self):
        res = self.harvester.get_gemini_string_and_guid(GEMINI_MISSING_GUID, url=None)
        assert_equal(res, (GEMINI_MISSING_GUID, ''))

    def test_get_gemini_string_and_guid__non_parsing(self):
        content = '<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco">' # no closing tag
        res = self.harvester.get_gemini_string_and_guid(content, url='TESTURL')
        assert_equal(res, (None, None))
        assert_equal(self.get_gather_error(), 'Content is not a valid XML document (TESTURL): Premature end of data in tag MD_Metadata line 1, line 1, column 38')

    def test_get_gemini_string_and_guid__empty(self):
        content = ''
        res = self.harvester.get_gemini_string_and_guid(content, url='TESTURL')
        assert_equal(res, (None, None))
        assert_equal(self.get_gather_error(), 'Content is blank/empty (TESTURL)')

    def test_get_gemini_string_and_guid__wrong_element(self):
        content = '<notMetadata/>' # i.e. not metadata
        res = self.harvester.get_gemini_string_and_guid(content, url='TESTURL')
        assert_equal(self.get_gather_error(), 'Content is not a valid Gemini document without the gmd:MD_Metadata element (TESTURL)')

    def test_get_gemini_string_and_guid__bad_char_encoding(self):
        # Should be "&amp;" rather than "&"
        content = '''<gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gco="http://www.isotc211.org/2005/gco">
    <gmd:URL>http://www.geostore.com/OGC/OGCInterface?INTERFACE=ENVIRONMENT&UID=UDATAGOV2011&PASSWORD=datagov2011&LC=3ffff800000000000&</gmd:URL>
</gmd:MD_Metadata>'''
        res = self.harvester.get_gemini_string_and_guid(content, url='TESTURL')
        assert_equal(self.get_gather_error(), 'Content is not a valid XML document (TESTURL): EntityRef: expecting \';\', line 2, column 80')

class TestImportStageTools:
    def test_licence_url_normal(self):
        assert_equal(GeminiHarvester._extract_licence_urls(
            ['Reference and PSMA Only',
             'http://www.test.gov.uk/licenseurl']),
                     ['http://www.test.gov.uk/licenseurl'])

    def test_licence_url_multiple_urls(self):
        # only the first URL is extracted
        assert_equal(GeminiHarvester._extract_licence_urls(
            ['Reference and PSMA Only',
             'http://www.test.gov.uk/licenseurl',
             'http://www.test.gov.uk/2nd_licenseurl']),
                     ['http://www.test.gov.uk/licenseurl',
                      'http://www.test.gov.uk/2nd_licenseurl'])

    def test_licence_url_embedded(self):
        # URL is embedded within the text field and not extracted
        assert_equal(GeminiHarvester._extract_licence_urls(
            ['Reference and PSMA Only http://www.test.gov.uk/licenseurl']),
                     [])

    def test_licence_url_embedded_at_start(self):
        # URL is embedded at the start of the text field and the
        # whole field is returned. Noting this unusual behaviour
        assert_equal(GeminiHarvester._extract_licence_urls(
            ['http://www.test.gov.uk/licenseurl Reference and PSMA Only']),
                     ['http://www.test.gov.uk/licenseurl Reference and PSMA Only'])

    def test_responsible_organisation_basic(self):
        responsible_organisation = [{'organisation-name': 'Ordnance Survey',
                                     'role': 'owner'},
                                    {'organisation-name': 'Maps Ltd',
                                     'role': 'distributor'}]
        assert_equal(GeminiHarvester._process_responsible_organisation(responsible_organisation),
                     ('Ordnance Survey', ['Maps Ltd (distributor)',
                                          'Ordnance Survey (owner)']))

    def test_responsible_organisation_publisher(self):
        # no owner, so falls back to publisher
        responsible_organisation = [{'organisation-name': 'Ordnance Survey',
                                     'role': 'publisher'},
                                    {'organisation-name': 'Maps Ltd',
                                     'role': 'distributor'}]
        assert_equal(GeminiHarvester._process_responsible_organisation(responsible_organisation),
                     ('Ordnance Survey', ['Maps Ltd (distributor)',
                                          'Ordnance Survey (publisher)']))

    def test_responsible_organisation_owner(self):
        # provider is the owner (ignores publisher)
        responsible_organisation = [{'organisation-name': 'Ordnance Survey',
                                     'role': 'publisher'},
                                    {'organisation-name': 'Owner',
                                     'role': 'owner'},
                                    {'organisation-name': 'Maps Ltd',
                                     'role': 'distributor'}]
        assert_equal(GeminiHarvester._process_responsible_organisation(responsible_organisation),
                     ('Owner', ['Owner (owner)',
                                'Maps Ltd (distributor)',
                                'Ordnance Survey (publisher)',
                                ]))

    def test_responsible_organisation_multiple_roles(self):
        # provider is the owner (ignores publisher)
        responsible_organisation = [{'organisation-name': 'Ordnance Survey',
                                     'role': 'publisher'},
                                    {'organisation-name': 'Ordnance Survey',
                                     'role': 'custodian'},
                                    {'organisation-name': 'Distributor',
                                     'role': 'distributor'}]
        assert_equal(GeminiHarvester._process_responsible_organisation(responsible_organisation),
                     ('Ordnance Survey', ['Distributor (distributor)',
                                          'Ordnance Survey (publisher, custodian)',
                                ]))

    def test_responsible_organisation_blank_provider(self):
        # no owner or publisher, so blank provider
        responsible_organisation = [{'organisation-name': 'Ordnance Survey',
                                     'role': 'resourceProvider'},
                                    {'organisation-name': 'Maps Ltd',
                                     'role': 'distributor'}]
        assert_equal(GeminiHarvester._process_responsible_organisation(responsible_organisation),
                     ('', ['Maps Ltd (distributor)',
                           'Ordnance Survey (resourceProvider)']))

    def test_responsible_organisation_blank(self):
        # no owner or publisher, so blank provider
        responsible_organisation = []
        assert_equal(GeminiHarvester._process_responsible_organisation(responsible_organisation),
                     ('', []))

    def test_licence_just_free_text(self):
        # no owner or publisher, so blank provider
        gemini = {'use_constraints': ['License available'],
                  'anchor_href': None,
                  'anchor_title': None}
        assert_equal(GeminiHarvester._process_licence(**gemini),
                     ({'licence': ['License available']}))

    def test_licence_free_text_and_url(self):
        # no owner or publisher, so blank provider
        gemini = {'use_constraints': ['License available', 'Good',
                                      'http://license.com/terms.html'],
                  'anchor_href': None,
                  'anchor_title': None}
        assert_equal(GeminiHarvester._process_licence(**gemini),
                     ({'licence': ['License available', 'Good'],
                       'licence_url': 'http://license.com/terms.html'}))

    def test_licence_multiple_urls(self):
        # no owner or publisher, so blank provider
        gemini = {'use_constraints': ['License available', 'Good',
                                      'http://license.com/terms1.html',
                                      'http://license.com/terms2.html'],
                  'anchor_href': None,
                  'anchor_title': None}
        assert_equal(GeminiHarvester._process_licence(**gemini),
                     ({'licence': ['License available', 'Good',
                                   'http://license.com/terms2.html'],
                       'licence_url': 'http://license.com/terms1.html'}))

    def test_licence_anchor_url(self):
        # no owner or publisher, so blank provider
        gemini = {'use_constraints': ['License available', 'Good',
                                      'http://license.com/terms1.html',
                                      'http://license.com/terms2.html'],
                  'anchor_href': 'http://license.com/terms.html',
                  'anchor_title': None}
        assert_equal(GeminiHarvester._process_licence(**gemini),
                     ({'licence': ['License available', 'Good',
                                   'http://license.com/terms1.html',
                                   'http://license.com/terms2.html'],
                       'licence_url': 'http://license.com/terms.html'}))

    def test_licence_anchor(self):
        # no owner or publisher, so blank provider
        gemini = {'use_constraints': ['License available', 'Good',
                                      'http://license.com/terms1.html',
                                      'http://license.com/terms2.html'],
                  'anchor_href': 'http://license.com/terms.html',
                  'anchor_title': 'The terms'}
        assert_equal(GeminiHarvester._process_licence(**gemini),
                     ({'licence': ['License available', 'Good',
                                   'http://license.com/terms1.html',
                                   'http://license.com/terms2.html'],
                       'licence_url': 'http://license.com/terms.html',
                       'licence_url_title': 'The terms'}))

class TestValidation(HarvestFixtureBase):

    @classmethod
    def setup_class(cls):
        SpatialHarvester._validator = Validators(profiles=['iso19139eden', 'constraints-1.4', 'gemini2'])
        HarvestFixtureBase.setup_class()

    def get_validation_errors(self, validation_test_filename):
        # Create source
        source_fixture = {
            'url': u'http://127.0.0.1:8999/gemini2.1/validation/%s' % validation_test_filename,
            'type': u'gemini-single'
        }

        source, job = self._create_source_and_job(source_fixture)

        harvester = GeminiDocHarvester()

        object_ids = harvester.gather_stage(job)
        if not object_ids:
            # this would only occur for e.g. missing GUID
            errors = '; '.join([gather_error.message for gather_error in job.gather_errors])
            return errors

        obj = HarvestObject.get(object_ids[0])
        # No fetch stage for GeminiHarvestDocHarvester
        # Import stage includes validation
        harvester.import_stage(obj)

        # Check the validation errors
        errors = '; '.join([object_error.message for object_error in obj.errors])
        return errors

    def test_01_dataset_fail_iso19139_schema(self):
        errors = self.get_validation_errors('01_Dataset_Invalid_XSD_No_Such_Element.xml')
        assert len(errors) > 0
        #assert_in('ISO19139', errors)
        #assert_in('(gmx.xsd)', errors)
        assert_in('Could not get the GUID', errors)

    def test_01a_dataset_fail_iso19139_schema(self):
        errors = self.get_validation_errors('01a_Dataset_Invalid_XSD_No_Such_Element.xml')
        assert len(errors) > 0
        assert_in('ISO19139', errors)
        assert_in('(gmx.xsd)', errors)
        assert_in('Element \'{http://www.isotc211.org/2005/gmd}language\': This element is not expected', errors)

    def test_02_dataset_fail_constraints_schematron(self):
        errors = self.get_validation_errors('02_Dataset_Invalid_19139_Missing_Data_Format.xml')
        assert len(errors) > 0
        assert_in('Constraints', errors)
        assert_in('MD_Distribution / MD_Format: count(distributionFormat + distributorFormat) > 0', errors)

    def test_03_dataset_fail_gemini_schematron(self):
        errors = self.get_validation_errors('03_Dataset_Invalid_GEMINI_Missing_Keyword.xml')
        assert len(errors) > 0
        assert_in('GEMINI', errors)
        assert_in('Descriptive keywords are mandatory', errors)

    def test_04_dataset_valid(self):
        errors = self.get_validation_errors('04_Dataset_Valid.xml')
        assert len(errors) == 0

    def test_05a_series_fail_iso19139_schema(self):
        errors = self.get_validation_errors('05a_Series_Invalid_XSD_No_Such_Element.xml')
        assert len(errors) > 0
        assert_in('ISO19139', errors)
        assert_in('(gmx.xsd)', errors)
        assert_in('Element \'{http://www.isotc211.org/2005/gmd}language\': This element is not expected., line 5', errors)

    def test_06_series_fail_constraints_schematron(self):
        errors = self.get_validation_errors('06_Series_Invalid_19139_Missing_Data_Format.xml')
        assert len(errors) > 0
        assert_in('Constraints', errors)
        assert_in('MD_Distribution / MD_Format: count(distributionFormat + distributorFormat) > 0', errors)

    def test_07_series_fail_gemini_schematron(self):
        errors = self.get_validation_errors('07_Series_Invalid_GEMINI_Missing_Keyword.xml')
        assert len(errors) > 0
        assert_in('GEMINI', errors)
        assert_in('Descriptive keywords are mandatory', errors)

    def test_08_series_valid(self):
        errors = self.get_validation_errors('08_Series_Valid.xml')
        assert len(errors) == 0

    def test_09a_service_fail_iso19139_schema(self):
        errors = self.get_validation_errors('09a_Service_Invalid_No_Such_Element.xml')
        assert len(errors) > 0
        assert_in('ISO19139', errors)
        assert_in('(gmx.xsd & srv.xsd)', errors)
        assert_in('Element \'{http://www.isotc211.org/2005/gmd}language\': This element is not expected., line 5', errors)

    def test_10_service_fail_constraints_schematron(self):
        errors = self.get_validation_errors('10_Service_Invalid_19139_Level_Description.xml')
        assert len(errors) > 0
        assert_in('Constraints', errors)
        assert_in("DQ_Scope: 'levelDescription' is mandatory if 'level' notEqual 'dataset' or 'series'.", errors)

    def test_11_service_fail_gemini_schematron(self):
        errors = self.get_validation_errors('11_Service_Invalid_GEMINI_Service_Type.xml')
        assert len(errors) > 0
        assert_in('GEMINI', errors)
        assert_in("Service type shall be one of 'discovery', 'view', 'download', 'transformation', 'invoke' or 'other' following INSPIRE generic names.", errors)

    def test_12_service_valid(self):
        errors = self.get_validation_errors('12_Service_Valid.xml')
        assert len(errors) == 0, errors

    def test_13_dataset_fail_iso19139_schema_2(self):
        # This test Dataset has srv tags and only Service metadata should.
        errors = self.get_validation_errors('13_Dataset_Invalid_Element_srv.xml')
        assert len(errors) > 0
        assert_in('ISO19139', errors)
        assert_in('(gmx.xsd)', errors)
        assert_in('(u"Element \'{http://www.isotc211.org/2005/srv}SV_ServiceIdentification\': This element is not expected.', errors)


log = logging.getLogger(__name__)

class TestWafBaseUrl:
    def check(self, index_url, expected_base_url):
        assert_equal(GeminiWafHarvester._get_base_url(index_url),
                     expected_base_url)

    # NB http://example.com/dir usually gets 301 redirected to .../dir/

    def test_dir(self):
        self.check('http://example.com/dir/', 'http://example.com/dir/')

    def test_index(self):
        self.check('http://example.com/dir/index.html', 'http://example.com/dir/')

    def test_root(self):
        self.check('http://example.com/', 'http://example.com/')

    def test_no_path(self):
        self.check('http://example.com', 'http://example.com/')

    def test_canonical(self):
        self.check('scheme://netloc/path1/path2;parameters?query#fragment',
                   'scheme://netloc/path1/')

    def test_examples(self):
        # from ckanext.harvest.model import HarvestSource
        # [s.url for s in model.Session.query(HarvestSource).filter_by(type='gemini-waf').filter_by(active=True)]
        self.check('http://s3-eu-west-1.amazonaws.com/inspire-ne/index.html',
                   'http://s3-eu-west-1.amazonaws.com/inspire-ne/')
        self.check('http://www.ukho.gov.uk/inspire/metadata/index.html',
                   'http://www.ukho.gov.uk/inspire/metadata/')
        # http://www.gogeo.ac.uk/datagov/harvest 301 redirects to:
        self.check('http://www.gogeo.ac.uk/datagov/harvest/',
                   'http://www.gogeo.ac.uk/datagov/harvest/')
        # http://inspire.misoportal.com/metadata/files/harrogate 301:
        self.check('http://inspire.misoportal.com/metadata/files/harrogate/',
                   'http://inspire.misoportal.com/metadata/files/harrogate/')
        # http://services.english-heritage.org.uk/EnglishHeritageINSPIREDiscovery redirects to:
        self.check('http://services.english-heritage.org.uk/EnglishHeritageINSPIREDiscovery/',
                'http://services.english-heritage.org.uk/EnglishHeritageINSPIREDiscovery/'),
        self.check('http://services.english-heritage.org.uk/englishheritageINSPIREdiscovery/EH_INSPIREProtectedSites.xml',
                   'http://services.english-heritage.org.uk/englishheritageINSPIREdiscovery/')
        self.check('http://d291tfzo9i0ude.cloudfront.net',
                'http://d291tfzo9i0ude.cloudfront.net/')
        # http://www.ordnancesurvey.co.uk/oswebsite/xml/products redirects:
        self.check('http://www.ordnancesurvey.co.uk/xml/products/',
                   'http://www.ordnancesurvey.co.uk/xml/products/')
        self.check('http://partnerdataexport.ccw.gov.uk/gemini/',
                   'http://partnerdataexport.ccw.gov.uk/gemini/')
        self.check('http://dcsu059g9fk65.cloudfront.net',
                   'http://dcsu059g9fk65.cloudfront.net/')
        self.check('http://www.rotherham.nhs.uk/foi/',
                   'http://www.rotherham.nhs.uk/foi/')
        self.check('http://d1opzmrrdjgef4.cloudfront.net',
                   'http://d1opzmrrdjgef4.cloudfront.net/')
        # http://inspire.misoportal.com/metadata/files/tamworth redirects:
        self.check('http://inspire.misoportal.com/metadata/files/tamworth/',
                   'http://inspire.misoportal.com/metadata/files/tamworth/')
        # http://planning.northyorkmoors.org.uk/maps/xml redirects:
        self.check('http://planning.northyorkmoors.org.uk/maps/xml/',
                   'http://planning.northyorkmoors.org.uk/maps/xml/')
        self.check('https://s3-eu-west-1.amazonaws.com/inspire-mmo/index.html',
                   'https://s3-eu-west-1.amazonaws.com/inspire-mmo/')
        self.check('http://inspire.misoportal.com/metadata/files/westminster/',
                   'http://inspire.misoportal.com/metadata/files/westminster/')
        self.check('http://inspire.misoportal.com/metadata/files/wychavon/',
                   'http://inspire.misoportal.com/metadata/files/wychavon/')

class TestWafExtract:
    def test_extract__simple(self):
        content = '''
<!DOCTYPE html>
<html>
    <head>
        <title>Index of /waf</title>
    </head>
    <body>
        <h1>Index of /waf</h1>
        <a href="wales1.xml">wales1.xml</a>
        <a href="wales2.xml">wales2.xml</a>
    </body>
</html>
'''
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/wales1.xml',
                            'http://base.com/waf/wales2.xml'])

    def test_extract__bad_xml(self):
        content = '<a href="wales1.xml">wales1.xml</a></br>'
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/wales1.xml'])

    def test_extract__ignore_slashes(self):
        content = '<a href="http://base.com/waf/wales1.xml">wales1.xml</a></br>'
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, [])

class TestWafExtractExamples:
    def test_extract__ukho(self):
        content = '''
<html>
    <head>
        <title>UKHO Metadata WAF</title>
    </head>
    <body>
        <a href="4ce68487-185a-309a-82ac-53db2cd8b503.xml">4ce68487-185a-309a-82ac-53db2cd8b503.xml</a><br>
        <a href="6c63002b-182d-3254-8ccd-31d2898fb96c.xml">6c63002b-182d-3254-8ccd-31d2898fb96c.xml</a><br>
    </body>
</html>
'''
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/4ce68487-185a-309a-82ac-53db2cd8b503.xml',
                            'http://base.com/waf/6c63002b-182d-3254-8ccd-31d2898fb96c.xml'])

    def test_extract__british_waterways(self):
        content = '''
<html>
<head><title>INSPIRE metadata - British Waterways</title></head>
<body>
<h2>INSPIRE metadata - British Waterways</h2><br><br>
<a href="Wharves.xml">Wharves.xml</a><br>
<a href="Outfall%5FDischarge%5FPoints.xml">Outfall Discharge Points.xml</a><br>

</body>
</html>
'''
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/Wharves.xml',
                            'http://base.com/waf/Outfall%5FDischarge%5FPoints.xml'])

    def test_extract__english_heritage(self):
        content = '''



<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>

</title></head>
<body>
    <form name="form1" method="post" action="default.aspx" id="form1">
<div>
<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="/wEPDwUIOTEyND=" />
</div>

    <div>
        <a href="EH_Battlefields.xml">EH_Battlefields.xml</a><br />
<a href="EH_BuildingPreservationNotice.xml">EH_BuildingPreservationNotice.xml</a><br />

    </div>
    </form>
</body>
</html>
'''
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/EH_Battlefields.xml',
                            'http://base.com/waf/EH_BuildingPreservationNotice.xml'])

    def test_extract__environment_agency(self):
        content = '''
<html>
<head><title>INSPIRE metadata - Environment Agency</title></head>
<body>
<h2>INSPIRE metadata - Environment Agency</h2><br><br>
<a href="Administrative+Boundaries+-+Public+Face+Areas.xml">Administrative Boundaries - Public Face Areas .xml</a><br>
<a href="Administrative+Boundaries+-+Public+Face+Regions.xml">Administrative Boundaries - Public Face Regions.xml</a><br>
</body>
</html>
'''
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/Administrative+Boundaries+-+Public+Face+Areas.xml',
                            'http://base.com/waf/Administrative+Boundaries+-+Public+Face+Regions.xml'])

    def test_extract__natural_england(self):
        content = '''
<html>
<head><title>INSPIRE metadata - Natural England</title></head>
<body>
<h2>INSPIRE metadata - Natural England</h2><br><br>
<a href="Sites+of+Special+Scientific+Interest+England+Dataset.xml"> Sites of Special Scientific Interest England Dataset.xml</a><br>


</body>
</html>

'''
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/Sites+of+Special+Scientific+Interest+England+Dataset.xml'])

    def test_extract__os(self):
        content = open(os.path.join(xml_directory, 'gemini2.1-waf/os.xml'),
                       'rb').read()
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/10kBlackandWhiteRaster.xml',
                            'http://base.com/waf/10kcolRas.xml',
                            'http://base.com/waf/250colRas.xml',
                            'http://base.com/waf/25kColRas.xml',
                            'http://base.com/waf/50colRas.xml',
                            'http://base.com/waf/50kGaz.xml',
                            'http://base.com/waf/AddressBase.xml',
                            'http://base.com/waf/AddressBasePlus.xml',
                            'http://base.com/waf/AddressBasePremium.xml',
                            'http://base.com/waf/AddressLayer.xml',
                            'http://base.com/waf/AddressLayer2.xml',
                            'http://base.com/waf/BoundaryLine.xml',
                            'http://base.com/waf/CodePoint.xml',
                            'http://base.com/waf/CodePointOpen.xml',
                            'http://base.com/waf/CodePointwithPolygons.xml',
                            'http://base.com/waf/Imagery.xml',
                            'http://base.com/waf/ITN.xml',
                            'http://base.com/waf/Meridian2.xml',
                            'http://base.com/waf/OSLocator.xml',
                            'http://base.com/waf/OSMMSitesLayer.xml',
                            'http://base.com/waf/OSSVras.xml',
                            'http://base.com/waf/PanoramaContours.xml',
                            'http://base.com/waf/PanoramaDTM.xml',
                            'http://base.com/waf/ProfileContours.xml',
                            'http://base.com/waf/ProfileDTM.xml',
                            'http://base.com/waf/Strategi.xml',
                            'http://base.com/waf/Topo.xml',
                            'http://base.com/waf/VMD.xml',
                            'http://base.com/waf/VML.xml',
                            'http://base.com/waf/OSOnDemandService.xml',
                            'http://base.com/waf/UKLPCPS.xml',
                            'http://base.com/waf/OrdnanceSurveyAtomFeed.xml'])

    def test_extract__edinburgh(self):
        server = 'Apache'
        content = '''
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<html>
 <head>
  <title>Index of /datagov/harvest</title>
 </head>
 <body>
<h1>Index of /datagov/harvest</h1>
<pre>      <a href="?C=N;O=A">Name</a>                                     <a href="?C=M;O=A">Last modified</a>      <a href="?C=S;O=A">Size</a>  <a href="?C=D;O=A">Description</a><hr>      <a href="ffc4027c-bb5e-406a-90a6-0386f2729671.xml">ffc4027c-bb5e-406a-90a6-0386f2729671.xml</a> 24-Apr-2013 15:24   25K  
      <a href="f247bbe2-945e-4d5c-8dfe-5480272f81c5.xml">f247bbe2-945e-4d5c-8dfe-5480272f81c5.xml</a> 24-Apr-2013 15:24   28K  
<hr></pre>
</body></html>
'''
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/ffc4027c-bb5e-406a-90a6-0386f2729671.xml',
                            'http://base.com/waf/f247bbe2-945e-4d5c-8dfe-5480272f81c5.xml'])

    def test_extract__welsh_gov(self):
        content = '''
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
 <head>
  <title>Index of /gemini</title>
 </head>
 <body>
<h1>Index of /gemini</h1>
<table><tr><th><img src="/icons/blank.gif" alt="[ICO]" /></th><th>Name</th><th>Last modified</th><th>Size</th><th>Description</th></tr><tr><th colspan="5"><hr /></th></tr>
<tr><td valign="top"><img src="/icons/unknown.gif" alt="[   ]" /></td><td><a href="/">Parent Directory</a></td><td>&nbsp;</td><td align="right">  - </td></tr>
<tr><td valign="top"><img src="/icons/text.gif" alt="[TXT]" /></td><td><a href="G298736.xml">G298736.xml</a></td><td align="right">15-May-2013 06:58  </td><td align="right"> 22K</td></tr>
<tr><td valign="top"><img src="/icons/text.gif" alt="[TXT]" /></td><td><a href="G298740.xml">G298740.xml</a></td><td align="right">15-May-2013 06:59  </td><td align="right"> 21K</td></tr>
<tr><th colspan="5"><hr /></th></tr>
</table>
<address>Apache/2.2.3 (Oracle) Server at partnerdataexport.ccw.gov.uk Port 80</address>
</body></html>
'''
        urls = GeminiWafHarvester._extract_urls(content, 'http://base.com/waf/', log)
        assert_equal(urls, ['http://base.com/waf/G298736.xml',
                            'http://base.com/waf/G298740.xml'])
