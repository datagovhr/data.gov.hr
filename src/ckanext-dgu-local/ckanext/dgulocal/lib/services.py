"""
This file contains helpers and structures for dealing with the ESD
services and functions list which is hosted at the following URL:

  http://standards.esd.org.uk/xml?uri=list/functions&mappedToUri=list/services

At this point, we really don't care so much about the hierarchy, but we do
probably want to store the labels against the URIs so that we can match them in
the harvested datasets.
"""
import logging

import requests
import cStringIO
import lxml.etree

log = logging.getLogger(__name__)

INTERESING_TAG_LIST = ['Identifier', 'URI', 'Label', 'Description']

def load_services():
    """
    Loads the XML document for the service function list and returns it as a
    dictionary modelling the hierarchy for storing as a JSON blob.
    """
    url = "http://standards.esd.org.uk/xml?uri=list/functions&mappedToUri=list/services"
    log.debug("Fetching service list content")

    req = requests.get(url)
    if not req.ok:
        log.error("Failed to retrieve service list")
        return None

    return _load_functions_services(req.content)


def _load_functions_services(raw_data):
    data = cStringIO.StringIO(raw_data)
    try:
        doc = lxml.etree.parse(data)
    except Exception, e:
        log.exception(e)
        data.close()
        return

    def load_dict(xpath):
        data = {}
        for entry in doc.xpath(xpath):
            key = entry.xpath("./URI")[0].text
            d = {}
            for node in entry:
                if node.tag in INTERESING_TAG_LIST:
                    d[node.tag.lower()] = "".join([x for x in node.itertext()])
            data[key] = d
        return data

    functions = load_dict("//Function")
    services = load_dict("//Service")

    data.close()
    return {"functions": functions, "services": services}

