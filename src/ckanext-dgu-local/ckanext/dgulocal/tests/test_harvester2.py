from nose.tools import assert_equal
from mock import patch

from ckan import model
from ckan.model import Session,Package
from ckan.logic.schema import default_update_package_schema
from ckan.logic import get_action
from ckanext.harvest.model import HarvestSource, HarvestJob, HarvestObject
from ckanext.dgulocal.harvester import InventoryHarvester
from ckan.new_tests import factories

from test_harvester import MockObject
from xml_file_server import serve

# Start simple HTTP server that serves XML test files
serve()


# HarvestFixtureBase adapted from ckanext-spatial
class HarvestFixtureBase:

    def setup(self):
        # Add sysadmin user
        harvest_user = model.User(name=u'harvest', password=u'test', sysadmin=True)
        Session.add(harvest_user)
        Session.commit()

        package_schema = default_update_package_schema()
        self.context ={'model':model,
                       'session':Session,
                       'user':u'harvest',
                       'schema':package_schema,
                       'api_version': '2'}

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

        if not 'publisher_id' in source_fixture:
           source_fixture['publisher_id'] = self.publisher['id']

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
            assert len(obj.errors) == 0

        job.status = u'Finished'
        job.save()

        return obj

# Spatial tests
#from ckanext.dgulocal import model as dgulocal_model
#from base import SpatialTestBase
#class TestHarvest(HarvestFixtureBase, SpatialTestBase):
#
#    @classmethod
#    def setup_class(cls):
#        SpatialTestBase.setup_class()
#        dgulocal_model.init_tables(model.meta.engine)

class TestAbbreviations:
    def test_simple(self):
        assert_equal(InventoryHarvester._get_publisher_abbreviation(MockObject(extras={}, title='Cabinet Office')), 'CO')

    def test_hard(self):
        assert_equal(InventoryHarvester._get_publisher_abbreviation(MockObject(extras={}, title='Department for Environment, Food & Rural Affairs')), 'DEFRA')


class TestHarvest(HarvestFixtureBase):

    def setup(self):
        HarvestFixtureBase.setup(self)
        # Add publisher
        if not hasattr(self, 'publisher'):
            self.publisher = factories.Organization(
                title='Test Organization', abbreviation='TO', category='sub-organisation')

    def test_harvest_basic(self):

        # Create source
        source_fixture = {
            'title': 'Test Source',
            'name': 'test-source',
            'url': u'http://127.0.0.1:8999/esdInventory_live_truncated.xml',
            'type': u'inventory',
        }
        source, job = self._create_source_and_job(source_fixture)

        # Gather
        harvester = InventoryHarvester()
        # mock boundary stuff to avoid needing PostGIS - it is not tested here
        # and that allows this test to run on sqlite
        with patch('ckanext.dgulocal.harvester.get_boundary') as get_boundary:
            get_boundary.return_value = None
            object_ids = harvester.gather_stage(job)

        assert_equal(len(object_ids), 3)
        assert len(job.gather_errors) == 0

        # Fetch
        for object_id in object_ids:
            harvest_object = HarvestObject.get(object_id)
            assert harvest_object
            success = harvester.fetch_stage(harvest_object)
            assert_equal(success, True)
            assert not harvest_object.errors

        # Import
        objects = []
        for object_id in object_ids:
            obj = HarvestObject.get(object_id)
            assert obj
            objects.append(obj)
            harvester.import_stage(obj)
            assert not harvest_object.errors

        pkgs = Session.query(Package).filter(Package.type!=u'harvest_source').all()

        assert_equal(len(pkgs), 3)

        pkg_ids = [pkg.id for pkg in pkgs]

        for obj in objects:
            assert obj.current == True
            assert obj.package_id in pkg_ids

