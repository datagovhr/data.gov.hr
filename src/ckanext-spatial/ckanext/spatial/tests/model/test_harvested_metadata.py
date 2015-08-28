import os

from nose.tools import assert_equal

from ckanext.spatial.model import GeminiDocument

def open_xml_fixture(xml_filename):
    xml_filepath = os.path.join(os.path.dirname(__file__),
                                'xml',
                                xml_filename)
    with open(xml_filepath, 'rb') as f:
        xml_string_raw = f.read()

    try:
        xml_string = xml_string_raw.encode("utf-8")
    except UnicodeDecodeError, e:
        assert 0, 'ERROR: Unicode Error reading file \'%s\': %s' % \
               (metadata_filepath, e)
    return xml_string

def test_simple():
    xml_string = open_xml_fixture('gemini_dataset.xml')
    gemini_document = GeminiDocument(xml_string)
    gemini_values = gemini_document.read_values()
    assert_equal(gemini_values['guid'], 'test-dataset-1')
    assert_equal(gemini_values['metadata-date'], '2011-09-23T10:06:08')

def test_multiplicity_warning():
    # This dataset lacks a value for Metadata Date and should
    # produce a log.warning, but not raise an exception.
    xml_string = open_xml_fixture('FCSConservancyPolygons.xml')
    gemini_document = GeminiDocument(xml_string)
    gemini_values = gemini_document.read_values()
    assert_equal(gemini_values['guid'], 'B8A22DF4-B0DC-4F0B-A713-0CF5F8784A28')

class TestUseConstraints:
    @classmethod
    def setup_class(cls):
        xml_string = open_xml_fixture('gemini_dataset.xml')
        cls.gemini_document = GeminiDocument(xml_string)
        
    def test_strings(self):
        gemini_value = self.gemini_document.read_value('use-constraints')
        expected_constraints = ['Reference and PSMA Only',
                                'http://www.test.gov.uk/licenseurl',
                                'copyright']
        assert_equal(set(gemini_value), set(expected_constraints))

    def test_anchor_text(self):
        gemini_value = self.gemini_document.read_value('use-constraints-anchor-title')
        expected_constraints = 'OS OpenData Licence'
        assert_equal(set(gemini_value), set(expected_constraints))

    def test_anchor_href(self):
        gemini_value = self.gemini_document.read_value('use-constraints-anchor-href')
        expected_constraints = 'http://www.ordnancesurvey.co.uk/docs/licences/os-opendata-licence.pdf'
        assert_equal(set(gemini_value), set(expected_constraints))
