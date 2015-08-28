from logging import getLogger
from pylons import config

import ckan.plugins as p
import ckan.plugins.toolkit as toolkit

log = getLogger(__name__)



class CertificatesPlugin(p.SingletonPlugin):
    '''
    Plugin for finding and showing ODI Open Data Certificates if they are
    available.
    '''
    p.implements(p.ITemplateHelpers, inherit=True)

    def get_helpers(self):
        """
        A dictionary of helpers that will allow other extensions to determine
        if a given package has a certificate or not, and return the details
        of the certificate itself.
        """
        import ckanext.certificates.helpers as helpers
        helper_dict = {
            'is_certificates_installed': lambda: True,
            'has_certificate': helpers.has_certificate,
            'get_certificate_data': helpers.get_certificate_data,
        }
        return helper_dict
