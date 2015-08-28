import json
import re

import requests
from lxml import etree
from cStringIO import StringIO

NS_MAP = {'ns': 'http://www.w3.org/2005/Atom'}
Q_NAME = re.compile("{(?P<ns>.*)}(?P<element>.*)")

def entry_to_dict(entry):
    """
    Converts an XML element (which is an Atom /feed/entry) into a dictionary
    for consumption elsewhere.  It contains a pretty ugly way of stripping out
    the default namespace so that the dictionary keys are a little cleaner, and
    has some special logic for handling /feed/entry/link elements.
    """
    d = {}
    for node in entry.xpath('*'):

        # Strip out the namespace from the tag name
        match = Q_NAME.search(node.tag)
        name = match.groupdict().get("element") if match else node.tag

        if name == 'link':
            # Special handling for links, either uses a specific string
            # for links that are typed, or the rel value if it exists.
            # Failing both of these it will just use 'link' are the key
            rel = node.get('rel')
            href = node.get('href')

            if rel == 'http://schema.theodi.org/certificate#badge':
                types = {
                    'text/html': 'badge_html',
                    'application/javascript': 'badge_json',
                }
                d[types[node.get('type')]] = href
            elif rel:
                d[rel] = href
            else:
                d[name] = href
        else:
            # Direct mapping from element tag name to key
            d[name] = node.text
    return d

def generate_entries(log, url="https://certificates.theodi.org/datasets.feed"):
    """
    Yields dictionaries representing the entries found in the ODI Atom feed.
    """
    for entry in fetch_entries(log):
        yield entry_to_dict(entry)


def fetch_entries(log, url="https://certificates.theodi.org/datasets.feed"):
    """
    Process the Atom feed at the specified URL, and yields all of the entries it
    can find.  If the url that the feed was fetched from is NOT the last URL, then
    the next page is retrieved and processed in the same way.
    """
    out_of_pages = False

    while not out_of_pages:

        try:
            req = requests.get(url)
        except Exception, request_err:
            log.exception(request_err)
            return

        # We wrap the response in a StringIO to work around problems with various
        # versions of LXML processing, or not processing, utf8 properly.
        data = StringIO(req.content)

        try:
            doc = etree.parse(data)
        except Exception, e:
            # If we get this far either the options are:
            # 1. We've been given HTML of some form
            # 2. It is otherwise not valid XML.
            log.exception(e)
            log.error(req.content)
            return

        for entry in doc.xpath("/ns:feed/ns:entry", namespaces=NS_MAP):
            yield entry

        self_url = doc.xpath("/ns:feed/ns:link[@rel='self']", namespaces=NS_MAP)[0].get('href')
        last_url = doc.xpath("/ns:feed/ns:link[@rel='last']", namespaces=NS_MAP)[0].get('href')

        log.debug("SELF URL: {0}".format(self_url))
        log.debug("LAST URL: {0}".format(last_url))

        if self_url == last_url:
            log.debug("Feed has run out of pages, all done.")
            out_of_pages = True
        else:
            next_link = doc.xpath("/ns:feed/ns:link[@rel='next']", namespaces=NS_MAP)
            if next_link:
                url = next_link[0].get('href')
            else:
                # There is no next link, this must be the last page.
                out_of_pages = True

        if not out_of_pages:
            log.debug("Feed has another page of data, fetching...")


        del doc
        data.close()

def get_badge_data(log, url):
    """
    Fetches the JSON representing a specific certificate
    """
    try:
        req = requests.get(url)
    except Exception, request_err:
        log.exception(request_err)
        log.exception("There was a problem with the request at {0}".format(url))
        return None

    if req.status_code >= 400:
        log.exception("There was a problem with the request at {0}".format(url))
        return {}

    data = json.loads(req.content)['certificate']
    badge = {
        'level': data['level'],
        'created_at': data['created_at'],
        'jurisdiction': data['jurisdiction'],
        'title': data['dataset']['title'],
        'status': data.get('status', ''),
        'certificate_url': data.get('uri', ''),
        'badge_url': data.get('badges', {}).get('image/png', ''),
        'certification_type': data.get('certification_type', '')
    }

    # Source. Dependant on who certified it.
    cert_type = badge.get('certification_type')
    if cert_type == 'self certified':
        badge['source'] = "Self-Certified by %s (unverified)" % data['dataset']['publisher']
    elif cert_type == 'community certified':
        badge['source'] = "Community Certified"

    return badge


