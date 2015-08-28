import logging
from pprint import pprint
from nose.plugins.skip import SkipTest;

from ckan import model
from ckan.model import Package, Session
from ckan.lib.helpers import url_for,json
from ckan.lib.base import config


from ckan.tests import CreateTestData
from ckan.tests.functional.base import FunctionalTestCase

from ckanext.harvest.plugin import Harvest
from ckanext.harvest.model import HarvestSource, HarvestJob, setup as harvest_model_setup

log = logging.getLogger(__name__)

'''These tests are pretty broken. For now, here's how to test auth manually.

URLs:

/harvest
/harvest/new
/harvest/c9eeaa17-2291-4170-93ca-aec634aa0d63
/harvest/edit/c9eeaa17-2291-4170-93ca-aec634aa0d63
/harvest/refresh/c9eeaa17-2291-4170-93ca-aec634aa0d63

Try as anonymous, joe bloggs, publisher, sysadmin.

'''

class HarvestAuthBaseCase():
    @classmethod
    def setup_class(cls):
        harvest_model_setup()

    @classmethod
    def teardown_class(cls):
        pass

    def _test_auth_not_allowed(self,user_name = None, source = None, status = 401):

        if not source:
            # Create harvest source
            source = HarvestSource(url=u'http://test-source.com',type='ckan')
            Session.add(source)
            Session.commit()

        if user_name:
            extra_environ = {'REMOTE_USER': user_name.encode('utf8')}
        else:
            extra_environ = {}

        # List
        res = self.app.get('/harvest', status=status, extra_environ=extra_environ)
        # Create
        res = self.app.get('/harvest/new', status=status, extra_environ=extra_environ)
        # Read
        res = self.app.get('/harvest/%s' % source.id, status=status, extra_environ=extra_environ)
        # Edit
        res = self.app.get('/harvest/edit/%s' % source.id, status=status, extra_environ=extra_environ)
        # Refresh
        res = self.app.get('/harvest/refresh/%s' % source.id, status=status, extra_environ=extra_environ)

    def _test_auth_allowed(self,user_name,auth_profile=None):

        extra_environ={'REMOTE_USER': user_name.encode('utf8')}

        # List
        res = self.app.get('/harvest', extra_environ=extra_environ)
        assert 'Harvesting Sources' in res

        # Create
        res = self.app.get('/harvest/new', extra_environ=extra_environ)
        assert 'New harvest source' in res
        if auth_profile == 'publisher':
            assert 'publisher_id' in res
        else:
            assert not 'publisher_id' in res

        fv = res.forms['source-new']
        fv['url'] = u'http://test-source.com'
        fv['type'] = u'ckan'
        fv['title'] = u'Test harvest source'
        fv['description'] = u'Test harvest source'
        fv['config'] = u'{"a":1,"b":2}'

        if auth_profile == 'publisher':
            fv['publisher_id'] = self.publisher1.id

        res = fv.submit('save', extra_environ=extra_environ)
        assert not 'Error' in res, res

        source = Session.query(HarvestSource).first()
        assert source.url == u'http://test-source.com'
        assert source.type == u'ckan'

        # Read
        res = self.app.get('/harvest/%s' % source.id, extra_environ=extra_environ)
        assert 'Harvest Source Details' in res
        assert source.id in res
        assert source.title in res

        # Edit
        res = self.app.get('/harvest/edit/%s' % source.id, extra_environ=extra_environ)
        assert 'Edit harvest source' in res
        if auth_profile == 'publisher':
            assert 'publisher_id' in res
        else:
            assert not 'publisher_id' in res

        fv = res.forms['source-new']
        fv['title'] = u'Test harvest source Updated'

        res = fv.submit('save', extra_environ=extra_environ)
        assert not 'Error' in res, res

        source = Session.query(HarvestSource).first()
        assert source.title == u'Test harvest source Updated'

        # Refresh
        res = self.app.get('/harvest/refresh/%s' % source.id, extra_environ=extra_environ)

        job = Session.query(HarvestJob).first()
        assert job.source_id == source.id


class TestAuth(FunctionalTestCase, HarvestAuthBaseCase):

    def setup(self):

        model.Session.remove()
        CreateTestData.create(auth_profile='publisher')
        self.sysadmin_user = model.User.get('testsysadmin')
        self.normal_user = model.User.get('annafan') # Does not belong to a publisher
        self.publisher1_user = model.User.by_name('russianfan')
        self.publisher2_user = model.User.by_name('tester')

        # Create two Publishers
        rev = model.repo.new_revision()
        self.publisher1 = model.Group(name=u'test-publisher1',title=u'Test Publihser 1',type=u'organization')
        Session.add(self.publisher1)
        self.publisher2 = model.Group(name=u'test-publisher2',title=u'Test Publihser 2',type=u'organization')
        Session.add(self.publisher2)

        member1 = model.Member(table_name = 'user',
                         table_id = self.publisher1_user.id,
                         group=self.publisher1,
                         capacity='admin')
        Session.add(member1)
        member2 = model.Member(table_name = 'user',
                         table_id = self.publisher2_user.id,
                         group=self.publisher2,
                         capacity='admin')
        Session.add(member2)

        Session.commit()

    def teardown(self):
        model.repo.rebuild_db()

    def test_auth_publisher_profile_normal(self):
        self._test_auth_not_allowed(self.normal_user.name)

    def test_auth_publisher_profile_notloggedin(self):
        self._test_auth_not_allowed(status=302)

    def test_auth_publisher_profile_sysadmin(self):
        self._test_auth_allowed(self.sysadmin_user.name,auth_profile='publisher')

    def test_auth_publisher_profile_publisher(self):
        self._test_auth_allowed(self.publisher1_user.name,auth_profile='publisher')

    def test_auth_publisher_profile_different_publisher(self):

        # Create a source for publisher 1
        source = HarvestSource(url=u'http://test-source.com',type='ckan',
                               publisher_id=self.publisher1.id)
        Session.add(source)
        Session.commit()

        extra_environ = {'REMOTE_USER': self.publisher2_user.name.encode('utf8')}

        # List (Publihsers can see the sources list)
        res = self.app.get('/harvest', extra_environ=extra_environ)
        assert 'Harvesting Sources' in res
        # Create
        res = self.app.get('/harvest/new', extra_environ=extra_environ)
        assert 'New harvest source' in res
        assert 'publisher_id' in res

        # Check that this publihser is not allowed to manage sources from other publishers
        status = 401
        # Read
        res = self.app.get('/harvest/%s' % source.id, status=status, extra_environ=extra_environ)
        # Edit
        res = self.app.get('/harvest/edit/%s' % source.id, status=status, extra_environ=extra_environ)
        # Refresh
        res = self.app.get('/harvest/refresh/%s' % source.id, status=status, extra_environ=extra_environ)

