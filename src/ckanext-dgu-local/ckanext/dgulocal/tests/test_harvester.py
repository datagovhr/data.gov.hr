import json
from pprint import pprint

from nose.tools import assert_equal

from ckanext.harvest.harvesters.base import PackageDictDefaults
from ckanext.dgulocal.harvester import InventoryHarvester
from ckan.new_tests import factories

class MockObject(dict):
    def __getattr__(self, name):
        return self[name]

class TestGetPackageDict:

    @classmethod
    def setup_class(cls):
        cls.publisher = factories.Organization(title='Cabinet Office', category='ministerial-department')

    def _get_test_harvest_object(self):
        content = '''
    <inv:Dataset xmlns:inv="http://schemas.esd.org.uk/inventory" Modified="2013-12-01" Active="Yes">
      <inv:Identifier>payments_over_500</inv:Identifier>
      <inv:Title>Test dataset</inv:Title>
      <inv:Description>Test description</inv:Description>
      <inv:Rights>http://www.nationalarchives.gov.uk/doc/open-government-licence/</inv:Rights>
      <inv:Resources>
        <inv:Resource Type="" Modified="2013-12-01" Active="Yes" Language="en">
          <inv:Identifier>payments_over_500.aspx</inv:Identifier>
          <inv:Title>Payments over 500 webpage</inv:Title>
          <inv:Description>Web page describing and listing peterborough payments over 500 data</inv:Description>
          <inv:Renditions>
            <inv:Rendition Active="Yes">
              <inv:Identifier>http://test.com/file.xls</inv:Identifier>
              <inv:MimeType>text/csv</inv:MimeType>
              <inv:Title>Some file</inv:Title>
              <inv:Description>Web page describing and listing peterborough payments over 500 data</inv:Description>
              <inv:Availability>Download</inv:Availability>
              <inv:ConformsTo>http://schemas.opendata.esd.org.uk/publictoilets/PublicToilets.xml?v=0.24</inv:ConformsTo>
            </inv:Rendition>
          </inv:Renditions>
        </inv:Resource>
      </inv:Resources>
    </inv:Dataset>
        '''
        harvest_source = MockObject(publisher_id=self.publisher['id'])
        harvest_job = MockObject(source=harvest_source)
        harvest_object = MockObject(
                job=harvest_job,
                content=content,
                guid='testguid',
                )
        return harvest_object

    def test_get_package_dict(self):
        h = InventoryHarvester()
        harvest_object = self._get_test_harvest_object()
        package_dict_defaults = PackageDictDefaults()
        source_config = {}
        existing_pkg = MockObject(resources=[])
        pkg_dict = h.get_package_dict(harvest_object, package_dict_defaults,
                                      source_config, existing_pkg)
        pkg_dict['extras'] = sorted(pkg_dict['extras'])
        pprint(pkg_dict)
        assert_equal(pkg_dict, {
            'name': 'test-dataset-co',
            'title': u'Test dataset',
            'notes': u'Test description',
            'license_id': 'uk-ogl',
            'state': 'active',
            'tags': [],
            'resources': [{'description': u'Some file - Download',
                           'format': 'CSV',
                           'resource_type': 'documentation',
                           'url': u'http://test.com/file.xls',
                           'schema-url': 'http://schemas.opendata.esd.org.uk/publictoilets/PublicToilets.xml?v=0.24',
                           'schema-type': 'csvlint',
                           }],
            'extras': [{'key': 'harvest_source_reference', 'value': 'testguid'},
                       {'key': 'inventory_identifier', 'value': 'payments_over_500'},
                       {'key': 'lga_functions', 'value': ''},
                       {'key': 'lga_services', 'value': ''}],
            })
