import urllib2
import time

from sqlalchemy.util import OrderedDict
from nose.tools import assert_equal

from ckan import model
from ckan.lib.create_test_data import CreateTestData
from ckan.tests import *
from ckan.tests import CreateTestData, TestSearchIndexer, is_search_supported
from ckan.tests.wsgi_ckanclient import WsgiCkanClient
from ckanclient import CkanClient
from ckanext.importlib.loader import ReplaceByNameLoader, ReplaceByExtraFieldLoader, ResourceSeriesLoader, LoaderError

USER = u'annafan'

# Set to true for quicker tests using wsgi_ckanclient
# otherwise it uses ckanclient
# (some tests still fail with ckanclient currently)
WSGI_CLIENT = True

#TODO: test log statements

def count_pkgs():
    return model.Session.query(model.Package).count()

class TestLoaderBase(TestController):
    @classmethod
    def setup_class(self):
        if hasattr(super(TestLoaderBase, self), 'setup_class'):
            super(TestLoaderBase, self).setup_class()
        CreateTestData.create_arbitrary([], extra_user_names=[USER])
        user = model.User.by_name(USER)
        assert user
        if WSGI_CLIENT:
            self.testclient = WsgiCkanClient(self.app, api_key=user.apikey)
        else:
            self.sub_proc = self._start_ckan_server('test.ini')
            self.testclient = CkanClient(base_location='http://localhost:5000/api',
                                         api_key=user.apikey)
            self._wait_for_url(url='http://localhost:5000/api')


    @classmethod
    def teardown_class(self):
        if hasattr(super(TestLoaderBase, self), 'teardown_class'):
            super(TestLoaderBase, self).teardown_class()
        if WSGI_CLIENT:
            model.Session.remove()
            model.repo.rebuild_db()
        else:
            try:
                self._stop_ckan_server(self.sub_proc)
            finally:
                model.repo.rebuild_db()

def assert_equal_dicts(dict1, dict2, only_assert_these_keys=None):
    only_assert_these_keys = set(only_assert_these_keys) if only_assert_these_keys else set([])
    dict1_keys = set(dict1.keys()) & only_assert_these_keys
    dict2_keys = set(dict2.keys()) & only_assert_these_keys
    key_diffs = dict1_keys ^ dict2_keys
    if key_diffs:
        print '%i keys not in both dicts.' % len(key_diffs)
        print 'Only in dict1: %r' % (dict1_keys - dict2_keys)
        print 'Only in dict2: %r' % (dict2_keys - dict1_keys)
        print '\nDict1: %r\nDict2: %r' % \
              (dict1, dict2)
        raise AssertionError
    for key in dict1_keys:
        if dict1[key] != dict2[key]:
            print 'Value for key %r is different. %r != %r' % \
                  (key, dict1[key], dict2[key])
            raise AssertionError

class TestLoader(TestLoaderBase):
    @classmethod
    def setup_class(self):
        super(TestLoader, self).setup_class()
        self.loader = ReplaceByNameLoader(self.testclient)

    # teardown is in the base class

    def test_0_simple_load(self):
        pkg_dict = {'name':u'pkgname',
                    'title':u'Boris'}
        assert not model.Package.by_name(pkg_dict['name'])
        CreateTestData.flag_for_deletion(pkg_names=[pkg_dict['name']])
        res_pkg_dict = self.loader.load_package(pkg_dict)
        assert res_pkg_dict
        pkg = model.Package.by_name(pkg_dict['name'])
        assert_equal_dicts(res_pkg_dict, pkg.as_dict(),
                           only_assert_these_keys=('name', 'title'))
        assert pkg
        assert pkg.name == pkg_dict['name']
        assert pkg.title == pkg_dict['title']

    def test_1_load_several(self):
        num_pkgs = count_pkgs()
        pkg_dicts = [{'name':u'pkgname_a',
                      'title':u'BorisA'},
                     {'name':u'pkgname_b',
                      'title':u'BorisB'},
                     ]
        assert not model.Package.by_name(pkg_dicts[0]['name'])
        CreateTestData.flag_for_deletion(pkg_names=[pkg_dict['name'] for pkg_dict in pkg_dicts])
        res = self.loader.load_packages(pkg_dicts)
        assert (res['num_loaded'], res['num_errors']) == (2, 0), \
               (res['num_loaded'], res['num_errors'])
        assert count_pkgs() == num_pkgs + 2, (count_pkgs() - num_pkgs)
        for pkg_index, pkg_dict in enumerate(pkg_dicts):
            pkg_name = pkg_dict['name']
            pkg = model.Package.by_name(pkg_name)
            assert pkg.id == res['pkg_ids'][pkg_index], \
                   '%s != %s' % (pkg.id, res['pkg_ids'][pkg_index])

    def test_1_load_several_with_errors(self):
        num_pkgs = count_pkgs()
        pkg_dicts = [{'name':u'pkgnameA', # not allowed uppercase name
                      'title':u'BorisA'},
                     {'name':u'pkgnameB',
                      'title':u'BorisB'},
                     ]
        assert not model.Package.by_name(pkg_dicts[0]['name'])
        CreateTestData.flag_for_deletion(pkg_names=[pkg_dict['name'] for pkg_dict in pkg_dicts])
        res = self.loader.load_packages(pkg_dicts)
        assert (res['num_loaded'], res['num_errors']) == (0, 2), \
               (res['num_loaded'], res['num_errors'])               
        assert count_pkgs() == num_pkgs, (count_pkgs() - num_pkgs)
        assert res['pkg_ids'] == [], res['pkg_ids']

    def test_2_reload(self):
        # load the package once
        num_pkgs = count_pkgs()
        pkg_dict = {'name':u'pkgname2',
                    'title':u'Boris'}
        assert not model.Package.by_name(pkg_dict['name'])
        CreateTestData.flag_for_deletion(pkg_names=[pkg_dict['name']])
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

        # load the package again
        pkg_dict = {'name':u'pkgname2',
                    'title':u'Boris Becker'}
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert pkg.name == pkg_dict['name']
        assert pkg.title == pkg_dict['title'], pkg.title
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)


class TestLoaderUsingUniqueFields(TestLoaderBase):
    @classmethod
    def setup_class(self):
        self.tsi = TestSearchIndexer()
        super(TestLoaderUsingUniqueFields, self).setup_class()
        self.loader = ReplaceByExtraFieldLoader(self.testclient, 'ref')

    # teardown is in the base class

    def test_0_reload(self):
        # create initial package
        num_pkgs = count_pkgs()
        pkg_dict = {'name':u'pkgname0',
                    'title':u'Boris',
                    'extras':{u'ref':'boris'}}
        assert not model.Package.by_name(pkg_dict['name'])
        CreateTestData.create_arbitrary([pkg_dict])
        self.tsi.index()
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

        # load the package with same name and ref
        pkg_dict = {'name':u'pkgname0',
                    'title':u'Boris 2',
                    'extras':{u'ref':'boris'}}
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert pkg.name == pkg_dict['name']
        assert pkg.title == pkg_dict['title']
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

        # load the package with different name, same ref
        pkg_dict = {'name':u'pkgname0changed',
                    'title':u'Boris 3',
                    'extras':{u'ref':'boris'}}
        CreateTestData.flag_for_deletion(pkg_names=[pkg_dict['name']])

        self.loader.load_package(pkg_dict)
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)
        # for now we do not support renaming
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg is None, pkg
        pkg = model.Package.by_name(u'pkgname0')
        assert pkg
        assert pkg.title == pkg_dict['title']

        # load the package with same name, different ref - new package
        other_pkg_dict = pkg_dict
        pkg_dict = {'name':u'pkgname0',
                    'title':u'Boris 4',
                    'extras':{u'ref':'boris-4'}}
        CreateTestData.flag_for_deletion(pkg_names=[pkg_dict['name']])
        self.loader.load_package(pkg_dict)
        assert pkg_dict['name'] == 'pkgname0_'
        orig_pkg = model.Package.by_name(u'pkgname0')
        assert orig_pkg
        assert orig_pkg.title == u'Boris 3'
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert pkg.name == pkg_dict['name']
        assert pkg.title == pkg_dict['title']
        assert count_pkgs() == num_pkgs + 2, (count_pkgs() - num_pkgs)

    def test_1_avoid_long_name_clash(self):
        # load the package once
        num_pkgs = count_pkgs()
        pkg_dict = {'name':u'a'*99,
                    'title':u'99 char name',
                    'extras':{u'ref':'aaa'}}
        assert not model.Package.by_name(pkg_dict['name'])
        CreateTestData.flag_for_deletion(pkg_names=[pkg_dict['name']])
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

        # load a clashing package - name appended '_'
        orig_pkg = pkg_dict
        pkg_dict = {'name':orig_pkg['name'],
                     'title':u'bbb',
                     'extras':{u'ref':'bbb'}}
        self.loader.load_package(pkg_dict)
        clash_name = u'a'*99 + u'_'
        pkg = model.Package.by_name(clash_name)
        assert pkg
        assert pkg.title == pkg_dict['title'], pkg.title
        assert count_pkgs() == num_pkgs + 2, (count_pkgs() - num_pkgs)

        # load another clashing package - name over 100 chars so shortened
        # and finishes '__'
        orig_pkg = pkg_dict
        pkg_dict = {'name':orig_pkg['name'],
                     'title':u'ccc',
                     'extras':{u'ref':'ccc'}}
        self.loader.load_package(pkg_dict)
        clash_name = u'a'*98 + u'__'
        assert pkg_dict['name'] == clash_name, (pkg_dict['name'], clash_name)
        pkg = model.Package.by_name(clash_name)
        assert pkg
        assert pkg.title == pkg_dict['title'], pkg.title
        assert count_pkgs() == num_pkgs + 3, (count_pkgs() - num_pkgs)

        
class TestLoaderNoSearch(TestLoaderBase):
    '''Cope as best as possible if search indexing is flakey.'''
    @classmethod
    def setup_class(self):
        '''NB, no search indexing started'''
        if not is_search_supported():
            raise SkipTest("Search not supported")
        super(TestLoaderNoSearch, self).setup_class()
        self.loader = ReplaceByExtraFieldLoader(self.testclient, 'ref')

    # teardown is in the base class

    def test_0_reload(self):
        # create initial package
        num_pkgs = count_pkgs()
        pkg_dict = {'name':u'pkgname0',
                    'title':u'Boris',
                    'extras':{u'ref':'boris'}}
        assert not model.Package.by_name(pkg_dict['name'])
        CreateTestData.create_arbitrary([pkg_dict])
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

        # load the package with same name and ref
        pkg_dict = {'name':u'pkgname0',
                    'title':u'Boris 2',
                    'extras':{u'ref':'boris'}}
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert pkg.name == pkg_dict['name']
        assert pkg.title == pkg_dict['title']
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)
        # i.e. not tempted to create pkgname0_ alongside pkgname0

        
class TestLoaderGroups(TestLoaderBase):
    @classmethod
    def setup_class(self):
        super(TestLoaderGroups, self).setup_class()
        self.loader = ReplaceByNameLoader(self.testclient)

        assert count_pkgs() == 0, count_pkgs()
        pkg_dicts = [{'name':u'pkga'},
                     {'name':u'pkgb'},
                     {'name':u'pkgc'},
                     ]
        CreateTestData.create_arbitrary(pkg_dicts)
        group_dicts = [
            {'name':u'g1', 'packages':[u'pkga']},
            {'name':u'g2'},
            {'name':u'g3'},
            ]
        CreateTestData.create_groups(group_dicts, USER)
        self.pkgs = [model.Package.by_name(pkg_dict['name']) \
                     for pkg_dict in pkg_dicts]
        self.pkg_ids = [pkg.id for pkg in self.pkgs]
        
    # teardown is in the base class

    def test_0_add_to_empty_group(self):
        pkg_name = u'pkga'
        group_name = u'g2'
        pkg = model.Package.by_name(pkg_name)
        group = model.Group.by_name(group_name)
        assert group
        assert not group.packages, group.packages
        self.loader.add_pkg_to_group(pkg.name, group.name)
        group = model.Group.by_name(group_name)
        pkg = model.Package.by_name(pkg_name)
        assert group.packages == [pkg], group.packages
        
    def test_1_add_to_non_empty_group(self):
        pkg_name = u'pkgb'
        group_name = u'g1'
        pkg = model.Package.by_name(pkg_name)
        group = model.Group.by_name(group_name)
        assert group
        assert len(group.packages) == 1, group.packages
        self.loader.add_pkg_to_group(pkg.name, group.name)
        group = model.Group.by_name(group_name)
        pkg = model.Package.by_name(pkg_name)
        assert pkg in group.packages, group.packages
        assert len(group.packages) == 2, group.packages

    def test_2_add_multiple_packages(self):
        pkg_names = [u'pkgb', u'pkgc']
        group_name = u'g2'
        pkgs = [model.Package.by_name(pkg_name) for pkg_name in pkg_names]
        group = model.Group.by_name(group_name)
        assert group
        num_pkgs_at_start = len(group.packages)
        assert num_pkgs_at_start in (0, 1), group.packages
        self.loader.add_pkgs_to_group(pkg_names, group.name)
        group = model.Group.by_name(group_name)
        pkgs = [model.Package.by_name(pkg_name) for pkg_name in pkg_names]
        for pkg in pkgs:
            assert pkg in group.packages, group.packages
        assert len(group.packages) == num_pkgs_at_start + 2, group.packages

    def test_3_add_to_missing_group(self):
        pkg_names = [u'pkgb', u'pkgc']
        try:
            self.loader.add_pkgs_to_group(pkg_names, 'random_name')
        except LoaderError, e:
            assert e.args[0] == 'Group named \'random_name\' does not exist', e.args
        else:
            assert 0, 'Should have raise a LoaderError for the missing group'
        

class TestLoaderInsertingResources(TestLoaderBase):
    @classmethod
    def setup_class(self):
        self.tsi = TestSearchIndexer()
        super(TestLoaderInsertingResources, self).setup_class()
        self.loader = ResourceSeriesLoader(
            self.testclient,
            ['title', 'department'],
            'ons/id/',
            field_keys_to_expect_invariant=['country'])

    # teardown is in the base class

    def test_0_reload(self):
        # create initial package
        num_pkgs = count_pkgs()
        pkg_dict = {'name':u'pollution',
                    'title':u'Pollution',
                    'extras':{u'department':'air',
                              u'country':'UK', #invariant
                              u'last_updated':'Monday', #variant
                              },
                    'resources':[{'url':'pollution.com/1',
                                  'description':'ons/id/1'}],
                    }
        bogus_dict = {'name':u'bogus',
                      'title':u'Pollution',
                      'extras':{u'department':'water',
                              u'country':'UK', 
                              u'last_updated':'Monday',
                              },
                    'resources':[{'url':'pollution.com/2',
                                  'description':'ons/id/2'}],
                    }
        assert not model.Package.by_name(pkg_dict['name'])
        assert not model.Package.by_name(bogus_dict['name'])
        CreateTestData.create_arbitrary([pkg_dict, bogus_dict])
        self.tsi.index()
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert count_pkgs() == num_pkgs + 2, (count_pkgs() - num_pkgs)
        assert len(pkg.resources) == 1, pkg.resources

        # load the same package: same title, department, updated resource
        pkg_dict = {'name':u'pollution',
                    'title':u'Pollution',
                    'extras':{u'department':'air',
                              u'country':'UK', #invariant
                              u'last_updated':'Tuesday', #variant
                              },
                    'resources':[{'url':'pollution.com/id/1',
                                  'description':'ons/id/1'}],
                    }
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert pkg.name == pkg_dict['name']
        assert pkg.title == pkg_dict['title']
        assert pkg.extras['country'] == pkg_dict['extras']['country']
        assert pkg.extras['last_updated'] == pkg_dict['extras']['last_updated']
        assert count_pkgs() == num_pkgs + 2, (count_pkgs() - num_pkgs)
        assert len(pkg.resources) == 1, pkg.resources
        assert pkg.resources[0].url == pkg_dict['resources'][0]['url'], pkg.resources[0].url
        assert pkg.resources[0].description == pkg_dict['resources'][0]['description'], pkg.resources[0]['description']

        # load the same package: same title, department, new resource
        pkg_dict2 = {'name':u'pollution',
                    'title':u'Pollution',
                    'extras':{u'department':'air',
                              u'country':'UK', #invariant
                              u'last_updated':'Tuesday', #variant
                              },
                    'resources':[{'url':'pollution.com/id/3',
                                  'description':'ons/id/3'}],
                    }
        self.loader.load_package(pkg_dict2)
        pkg = model.Package.by_name(pkg_dict2['name'])
        assert pkg
        assert pkg.name == pkg_dict2['name']
        assert pkg.title == pkg_dict2['title']
        assert pkg.extras['country'] == pkg_dict2['extras']['country']
        assert pkg.extras['last_updated'] == pkg_dict2['extras']['last_updated']
        assert count_pkgs() == num_pkgs + 2, (count_pkgs() - num_pkgs)
        assert len(pkg.resources) == 2, pkg.resources
        print pkg.resources
        assert_equal(pkg.resources[0].url, pkg_dict['resources'][0]['url'])
        assert pkg.resources[0].description == pkg_dict['resources'][0]['description'], pkg.resources[0]['description']
        assert pkg.resources[1].url == pkg_dict2['resources'][0]['url'], pkg.resources[1].url
        assert pkg.resources[1].description == pkg_dict2['resources'][0]['description'], pkg.resources[1]['description']

        # load the different package: because of different department
        pkg_dict3 = {'name':u'pollution',
                    'title':u'Pollution',
                    'extras':{u'department':'river',
                              u'country':'UK', #invariant
                              u'last_updated':'Tuesday', #variant
                              },
                    'resources':[{'url':'pollution.com/id/3',
                                  'description':'Lots of pollution | ons/id/3'}],
                    }
        self.loader.load_package(pkg_dict3)
        CreateTestData.flag_for_deletion('pollution_')
        assert count_pkgs() == num_pkgs + 3, (count_pkgs() - num_pkgs)
        pkg_names = [pkg.name for pkg in model.Session.query(model.Package).all()]
        pkg = model.Package.by_name(u'pollution_')
        assert pkg
        assert pkg.extras['department'] == pkg_dict3['extras']['department']

        # load the same package: but with different country
        # should just get a warning
        pkg_dict4 = {'name':u'pollution',
                    'title':u'Pollution',
                    'extras':OrderedDict([
                         (u'department', 'air'),
                         (u'country', 'UK and France'), #invariant
                         (u'last_updated', 'Tuesday'), #variant
                         ]),
                    'resources':[OrderedDict([
                         ('url', 'pollution.com/id/3'),
                         ('description', 'Lots of pollution | ons/id/3'),
                         ])],
                    }
        self.loader.load_package(pkg_dict4)
        pkg = model.Package.by_name(pkg_dict4['name'])
        assert pkg
        assert pkg.name == pkg_dict4['name']
        assert pkg.title == pkg_dict4['title']
        assert pkg.extras['country'] == pkg_dict4['extras']['country']
        assert pkg.extras['last_updated'] == pkg_dict4['extras']['last_updated']
        assert count_pkgs() == num_pkgs + 3, (count_pkgs() - num_pkgs)
        assert len(pkg.resources) == 2, pkg.resources
        assert pkg.resources[0].url == pkg_dict['resources'][0]['url'], pkg.resources[0].url
        assert pkg.resources[0].description == pkg_dict['resources'][0]['description'], pkg.resources[0]['description']
        assert pkg.resources[1].url == pkg_dict4['resources'][0]['url'], pkg.resources[1].url
        assert pkg.resources[1].description == pkg_dict4['resources'][0]['description'], pkg.resources[1]['description']


class TestLoaderInsertingResourcesWithSynonym(TestLoaderBase):
    @classmethod
    def setup_class(self):
        self.tsi = TestSearchIndexer()
        super(TestLoaderInsertingResourcesWithSynonym, self).setup_class()
        self.loader = ResourceSeriesLoader(
            self.testclient,
            ['title', 'department'],
            'ons/id/',
            field_keys_to_expect_invariant=['country'],
            synonyms={'department': [('air', 'sky')]}
            )

    # teardown is in the base class

    def test_0_search_options(self):
        loader = ResourceSeriesLoader(
            self.testclient,
            ['title', 'department'],
            'ons/id/',
            field_keys_to_expect_invariant=['country'],
            synonyms={'department': [('dept1', 'dept2', 'dept3')],
                      'title': [('titleA', 'titleB', 'titleC')]}
            )
        field_keys = ['title', 'department']
        pkg_dict = {'title':'titleA',
                    'extras':{'department':'dept1'}}
        opts = loader._get_search_options(field_keys, pkg_dict)
        self.assert_equal(opts, [{'department': 'dept1', 'title': 'titleA'}, {'department': 'dept2', 'title': 'titleA'}, {'department': 'dept3', 'title': 'titleA'}, {'department': 'dept1', 'title': 'titleB'}, {'department': 'dept1', 'title': 'titleC'}, {'department': 'dept2', 'title': 'titleB'}, {'department': 'dept2', 'title': 'titleC'}, {'department': 'dept3', 'title': 'titleB'}, {'department': 'dept3', 'title': 'titleC'}])

    def test_1_reload(self):
        # create initial package
        num_pkgs = count_pkgs()
        pkg_dict = {'name':u'pollution',
                    'title':u'Pollution',
                    'extras':{u'department':'air',
                              u'country':'UK', #invariant
                              u'last_updated':'Monday', #variant
                              },
                    'resources':[{'url':'pollution.com/1',
                                  'description':'ons/id/1'}],
                    }
        bogus_dict = {'name':u'bogus',
                      'title':u'Pollution',
                      'extras':{u'department':'water',
                              u'country':'UK', 
                              u'last_updated':'Monday',
                              },
                    'resources':[{'url':'pollution.com/2',
                                  'description':'ons/id/2'}],
                    }
        assert not model.Package.by_name(pkg_dict['name'])
        assert not model.Package.by_name(bogus_dict['name'])
        CreateTestData.create_arbitrary([pkg_dict, bogus_dict])
        self.tsi.index()
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert count_pkgs() == num_pkgs + 2, (count_pkgs() - num_pkgs)
        assert len(pkg.resources) == 1, pkg.resources

        # load the similar package: same title, updated resource,
        # BUT synonym department
        pkg_dict = {'name':u'pollution',
                    'title':u'Pollution',
                    'extras':{u'department':'sky',
                              u'country':'UK', #invariant
                              u'last_updated':'Tuesday', #variant
                              },
                    'resources':[{'url':'pollution.com/id/1',
                                  'description':'ons/id/1'}],
                    }
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert pkg.name == pkg_dict['name']
        assert pkg.title == pkg_dict['title']
        assert pkg.extras['country'] == pkg_dict['extras']['country']
        assert pkg.extras['last_updated'] == pkg_dict['extras']['last_updated']
        assert count_pkgs() == num_pkgs + 2, (count_pkgs() - num_pkgs)
        assert len(pkg.resources) == 1, pkg.resources
        assert pkg.resources[0].url == pkg_dict['resources'][0]['url'], pkg.resources[0].url
        assert pkg.resources[0].description == pkg_dict['resources'][0]['description'], pkg.resources[0]['description']

        # load the different package: because of different department
        pkg_dict3 = {'name':u'pollution',
                    'title':u'Pollution',
                    'extras':{u'department':'river',
                              u'country':'UK', #invariant
                              u'last_updated':'Tuesday', #variant
                              },
                    'resources':[{'url':'pollution.com/id/3',
                                  'description':'Lots of pollution | ons/id/3'}],
                    }
        self.loader.load_package(pkg_dict3)
        CreateTestData.flag_for_deletion('pollution_')
        assert count_pkgs() == num_pkgs + 3, (count_pkgs() - num_pkgs)
        pkg_names = [pkg.name for pkg in model.Session.query(model.Package).all()]
        pkg = model.Package.by_name(u'pollution_')
        assert pkg
        assert pkg.extras['department'] == pkg_dict3['extras']['department']

class TestLoaderNoIndexing(TestLoaderBase):
    '''This checks you can re-load a package when the package name
    is unchanged, yet it is not search indexed (due to a problem with that).

    '''
    @classmethod
    def setup_class(self):
        # No TestSearchIndexer is initialised.
        if not is_search_supported():
            raise SkipTest("Search not supported")
        super(TestLoaderNoIndexing, self).setup_class()
        self.loader = ReplaceByExtraFieldLoader(self.testclient, 'ref')

    # teardown is in the base class

    def test_0_reload(self):
        # create initial package
        num_pkgs = count_pkgs()
        pkg_dict = {'name':u'pkgname0',
                    'title':u'Boris',
                    'extras':{u'ref':'boris'}}
        assert not model.Package.by_name(pkg_dict['name'])
        CreateTestData.create_arbitrary([pkg_dict])
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

        # load the package with same name and ref
        pkg_dict = {'name':u'pkgname0',
                    'title':u'Boris 2',
                    'extras':{u'ref':'boris'}}
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert pkg.name == pkg_dict['name']
        assert pkg.title == pkg_dict['title']
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

    def test_1_reload_with_underscores(self):
        # Create decoy package
        pkg_dict = {'name':u'pkgname1',
                    'title':u'Old package decoy',
                    'extras':{u'ref':'decoy'}}
        assert not model.Package.by_name(pkg_dict['name'])
        CreateTestData.create_arbitrary([pkg_dict])

        # create initial package
        num_pkgs = count_pkgs()
        pkg_dict = {'name':u'pkgname1_',
                    'title':u'The real Helga',
                    'extras':{u'ref':'helga'}}
        assert not model.Package.by_name(pkg_dict['name'])
        CreateTestData.create_arbitrary([pkg_dict])
        pkg = model.Package.by_name(pkg_dict['name'])
        assert pkg
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

        # load the package with same name and ref
        pkg_dict = {'name':u'pkgname1',
                    'title':u'Helga updated',
                    'extras':{u'ref':'helga'}}
        self.loader.load_package(pkg_dict)
        pkg = model.Package.by_name(u'pkgname1_')
        assert pkg
        assert_equal(pkg.title, pkg_dict['title'])
        assert count_pkgs() == num_pkgs + 1, (count_pkgs() - num_pkgs)

        decoy = model.Package.by_name(u'pkgname1')
        assert decoy
        assert_equal(decoy.title, u'Old package decoy')

        pkg = model.Package.by_name(u'pkgname1_')
        assert pkg
        assert_equal(pkg.title, u'Helga updated')

        assert not model.Package.by_name(u'pkgname1__')
