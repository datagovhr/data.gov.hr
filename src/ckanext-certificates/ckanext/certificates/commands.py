import json
import os
import sys

import ckanext.certificates.client as client

from ckan.lib.cli import CkanCommand

class CertificateCommand(CkanCommand):
    """
    Fetch certificates from theodi.org

    Fetches and parses the ODI atom feed (https://certificates.theodi.org/datasets.feed)
    checking each entry to see if it exists within the local site. If so then the
    URL of the HTML rendering, and the URL of the JSON describing the certificate are
    stored in package extras (odi-certificate-html and odi-certificate-json).
    """
    summary = __doc__.strip().split('\n')[0]
    usage = '\n' + __doc__
    max_args = 0
    min_args = 0

    def __init__(self, name):
        super(CertificateCommand, self).__init__(name)

    def setup_logging(self):
        import logging
        self.log = logging.getLogger(__name__)
        self.log.setLevel(logging.DEBUG)
        self.log.debug("Database access initialised")

    def command(self):
        # Load configuration
        self._load_config()

        # Initialise database access
        import ckan.model as model
        model.Session.remove()
        model.Session.configure(bind=model.meta.engine)

        # Logging, post-config
        self.setup_logging()

        from pylons import config

        site_url = config.get('ckan.site_url')

        # Handling of sites that support www. but don't use it.
        full_site_url = site_url
        if not '//www.' in full_site_url:
            full_site_url = full_site_url.replace('//', '//www.')

        from running_stats import StatsList
        stats = StatsList()

        # Use the generate_entries generator to get all of
        # the entries from the ODI Atom feed.  This should
        # correctly handle all of the pages within the feed.
        for entry in client.generate_entries(self.log):

            # We have to handle the case where the rel='about' might be missing, if so
            # we'll ignore it and catch it next time
            about = entry.get('about', '')
            if not about:
                self.log.debug(stats.add('Ignore - no rel="about" specifying the dataset',
                                         '%s "%s" %s' % (about, entry['title'], entry['id'])))
                continue

            if not about.startswith(site_url) and not about.startswith(full_site_url):
                self.log.debug(stats.add('Ignore - "about" field does not reference this site',
                                         '%s "%s" %s' % (about, entry['title'], entry['id'])))
                continue

            if not '/dataset/' in entry['about']:
                self.log.debug(stats.add('Ignore - is "about" DGU but not a dataset',
                                         '%s "%s" %s' % (about, entry['title'], entry['id'])))
                continue

            pkg = self._get_package_from_url(entry.get('about'))
            if not pkg:
                self.log.error(stats.add('Unable to find the package',
                                         '%s "%s" %s' % (about, entry['title'], entry['id'])))
                continue

            # Build the JSON subset we want to describe the certificate
            badge_data = client.get_badge_data(self.log, entry['alternate'])
            badge_data['cert_title'] = entry.get('content', '')

            badge_json = json.dumps(badge_data)
            if pkg.extras.get('odi-certificate') == badge_json:
                self.log.debug(stats.add('Certificate unchanged',
                                         badge_data['certificate_url']))
            else:
                model.repo.new_revision()
                pkg.extras['odi-certificate'] = json.dumps(badge_data)
                operation = 'updated' if 'odi-certificate' in pkg.extras else 'added'
                self.log.debug(stats.add('Certificate %s' % operation,
                               '"%s" %s' % (badge_data['title'],
                                            badge_data['certificate_url'])))
                model.Session.commit()

        self.log.info('Summary:\n' + stats.report())

    def _get_package_from_url(self, url):
        """
        Pulls data from the entry in an attempt to find a local package,
        which, if successful is returned.  None is returned if the package
        has been deleted, or is not a package for this site.
        """
        from urlparse import urlparse
        import ckan.model as model

        # Package name is the last part of the URL
        obj = urlparse(url)
        name = obj.path.split('/')[-1]

        return model.Package.get(name)

