import os
import datetime

from nose.tools import assert_equal, assert_raises

from ckanext.dgulocal.lib.inventory import InventoryDocument, InventoryXmlError


class TestInventory:


    def test_parse_error(self):
        assert_raises(InventoryXmlError, InventoryDocument, '<tag></wrongtag>')

    def test_validation_error(self):
        assert_raises(InventoryXmlError, InventoryDocument, '<tag></tag>')

    def test_serialize(self):
        node = _get_inventory_doc('test_inventory.xml').dataset_nodes().next()
        node_str = InventoryDocument.serialize_node(node)
        print node_str
        node_ = InventoryDocument.parse_xml_string(node_str)
        # test the round-trip
        node_str_ = InventoryDocument.serialize_node(node_)
        assert_equal(node_str.strip(), node_str_.strip())

    def test_parse_top_level_metadata(self):
        doc = _get_inventory_doc('test_inventory.xml')
        metadata = doc.top_level_metadata()
        assert_equal(len(metadata), 6)
        assert_equal(metadata['publisher'],
            'http://opendatacommunities.org/doc/unitary-authority/peterborough')
        assert_equal(metadata['modified'], datetime.date(2013, 12, 1))
        assert_equal(metadata['identifier'], 'http://datashare.esd.org.uk/')
        assert_equal(metadata['title'], 'Peterborough  datasets')
        assert_equal(metadata['description'], 'Sample inventory covering a selection of Peterborough City Council datasets')
        assert_equal(metadata['spatial-coverage-url'], 'http://statistics.data.gov.uk/id/statistical-geography/E06000031')

    def test_parse_datasets(self):
        doc = _get_inventory_doc('test_inventory.xml')
        dataset_node = doc.dataset_nodes().next()
        dataset = doc.dataset_to_dict(dataset_node)
        assert_equal(dataset['modified'], datetime.date(2013, 12, 1))
        assert_equal(dataset['active'], True)
        assert_equal(len(dataset['resources']), 3)
        res = dataset['resources'][0]
        assert_equal(res['url'], u'http://www.peterborough.gov.uk/council_and_democracy/payments_over_\xa3500.aspx')
        assert_equal(res['title'], u'Council payments over \xa3500')
        assert_equal(res['description'], u'Web page describing and listing peterborough payments over \xa3500 data')
        assert_equal(res['mimetype'], 'text/html')
        assert_equal(res['availability'], 'Download')

class TestInventoryLive:
    '''From time-to-time, update the test data from the live server:

        curl -o ckanext/dgulocal/tests/data/esdInventory_live.xml http://data.redbridge.gov.uk/api/esdinventory

    '''
    def test_parse_top_level_metadata_large(self):
        doc = _get_inventory_doc('esdInventory_live.xml')
        metadata = doc.top_level_metadata()
        assert_equal(metadata['publisher'], 'http://opendatacommunities.org/doc/local_authorities/unitary-authority/peterborough')
        assert_equal(metadata['modified'], datetime.date(2014, 7, 29))
        assert_equal(metadata['title'], 'Inventory covering a selection of ESD Test datasets')

    def test_parse_datasets_large(self):
        doc = _get_inventory_doc('esdInventory_live.xml')
        dataset_node = doc.dataset_nodes().next()
        dataset = doc.dataset_to_dict(dataset_node)
        assert_equal(dataset['modified'], datetime.date(2014, 3, 11))
        assert_equal(dataset['active'], True)
        assert_equal(len(dataset['resources']), 5)

    def test_validate_large(self):
        _get_inventory_doc('esdInventory_live.xml')


def _get_inventory_doc(inventory_xml_filename):
    path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data'))
    filepath = os.path.join(path, inventory_xml_filename)
    return InventoryDocument(open(filepath, 'r').read())
