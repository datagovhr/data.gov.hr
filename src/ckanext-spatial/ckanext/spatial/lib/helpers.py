# template helpers

from pkg_resources import resource_stream
from lxml import etree
from paste.deploy.converters import asbool
from pylons import config

from ckan import model
from ckan.lib.base import json
from ckanext.harvest.model import HarvestObject, HarvestCoupledResource
from ckanext.spatial.lib.coupled_resource import extract_gemini_harvest_source_reference

log = __import__('logging').getLogger(__name__)

def get_coupled_packages(pkg):
    res_type = pkg.extras.get('resource-type')
    if res_type in ('dataset', 'series'):
        coupled_resources = pkg.coupled_service
        coupled_packages = \
                  [(couple.service_record.name, couple.service_record.title) \
                   for couple in coupled_resources \
                   if couple.service_record_package_id and \
                   couple.service_record and \
                   couple.service_record.state == 'active']
        return coupled_packages

    elif res_type == 'service':
        # Find the dataset records which are pointed to in this service record
        coupled_resources = pkg.coupled_dataset
        coupled_packages = \
                  [(couple.dataset_record.name, couple.dataset_record.title) \
                   for couple in coupled_resources \
                   if couple.dataset_record_package_id and \
                   couple.dataset_record and \
                   couple.dataset_record.state == 'active']
        return coupled_packages

transformer = None
def transform_gemini_to_html(gemini_xml):
    from ckanext.spatial.model.harvested_metadata import GeminiDocument
    global transformer

    if not transformer or \
           not asbool(config.get('ckan.spatial.cache_gemini_xsl', True)):
        # transformer is cached between requests unless a developer wants to avoid this with the config option
        with resource_stream("ckanext.spatial",
                             "templates/ckanext/spatial/gemini2-html-stylesheet.xsl") as style:
            style_xml = etree.parse(style)
            transformer = etree.XSLT(style_xml)

    xml = etree.fromstring(gemini_xml)
    try:
        html = transformer(xml)
    except etree.XSLTApplyError, e:
        log.error('GEMINI2 XSLT error: %r\nGEMINI2: %s', e.error_log,
                  '\n'.join(gemini_xml.split('\n')[1:5]))
        body = '<h1>Server Error</h1><p>Error extracting values from GEMINI2 document. Administrators have been notified.</p>'
        return {}, body
    body = etree.tostring(html, pretty_print=True)

    gemini_doc = GeminiDocument(xml_tree=xml)
    publishers = gemini_doc.read_value('responsible-organisation')
    publisher = publishers[0].get('organisation-name', '') if publishers else ''
    header = {'title': gemini_doc.read_value('title'),
              'guid': gemini_doc.read_value('guid'),
              'publisher': publisher,
              'language': gemini_doc.read_value('metadata-language'),
              }
    return header, body

