"""
This plugin provides an entrypoint for all of the functionality in the
DGU Local Authority functionality which includes:

    * Harvesting datasets from local authority hosted servers.
    * Navigation to LA publishers via map/postcode lookup.
    * Custom schemas for the various schema defined by esd.

"""

import os
from logging import getLogger

from pylons import config

from ckan.plugins import implements, SingletonPlugin
from ckan.plugins import IFacets
from ckan.plugins import IDatasetForm
from ckan.plugins import IRoutes
from ckan.plugins import IConfigurer
from ckan.plugins import ITemplateHelpers
from ckan.plugins import IAuthFunctions
from ckan.plugins import IActions
import ckan.plugins.toolkit as toolkit
from ckan.config.routing import SubMapper

import ckan.logic.schema as default_schema

log = getLogger(__name__)

def _guess_package_type(self, expecting_name=False):
    from ckan.common import request
    if request.path.startswith('/local'):
        return 'local'
    return 'dataset'


class LocalPlugin(SingletonPlugin):
    implements(IRoutes, inherit=True)
    implements(IActions)
    implements(IAuthFunctions, inherit=True)
    implements(IConfigurer)
    implements(IFacets)
    implements(IDatasetForm)

    from ckan.controllers.package import PackageController
    PackageController._guess_package_type = _guess_package_type

    ## IFacets

    def dataset_facets(self, facets_dict, package_type):
        facets_dict['service'] = 'Services'
        facets_dict['function'] = 'Functions'
        facets_dict['local'] = 'Local Authority'
        return facets_dict


    # IConfigurer

    def update_config(self, config):
        toolkit.add_template_directory(config, 'theme/templates')
        toolkit.add_public_directory(config, 'theme/public')


    ## IRoutes

    def after_map(self, map):
        return map

    def before_map(self, map):
        ctlr = 'ckanext.dgulocal.controllers:LocalController'
        map.connect('/local', controller=ctlr, action='search')
        return map


    ## IAuthFunctions

    def get_auth_functions(self):
        return {
        }


    ## IActions

    def get_actions(self):
        return {}


    ## IDatasetForm

    def package_types(self):
        return ['local']

    def is_fallback(self):
        return False

    def create_package_schema(self):
        return default_schema.default_create_package_schema()

    def update_package_schema(self):
        return default_schema.default_update_package_schema()

    def show_package_schema(self):
        return default_schema.default_show_package_schema()

    def setup_template_variables(self, context, data_dict):
        pass

    def new_template(self):
        '''Return the path to the template for the new dataset page.

        The path should be relative to the plugin's templates dir, e.g.
        ``'package/new.html'``.

        :rtype: string
        '''

    def read_template(self):
        '''Return the path to the template for the dataset read page.

        The path should be relative to the plugin's templates dir, e.g.
        ``'package/read.html'``.

        If the user requests the dataset in a format other than HTML
        (CKAN supports returning datasets in RDF or N3 format by appending .rdf
        or .n3 to the dataset read URL, see :doc:`/linked-data-and-rdf`) then
        CKAN will try to render
        a template file with the same path as returned by this function,
        but a different filename extension, e.g. ``'package/read.rdf'``.
        If your extension doesn't have this RDF version of the template
        file, the user will get a 404 error.

        :rtype: string

        '''

    def edit_template(self):
        '''Return the path to the template for the dataset edit page.

        The path should be relative to the plugin's templates dir, e.g.
        ``'package/edit.html'``.

        :rtype: string

        '''

    def search_template(self):
        '''Return the path to the template for use in the dataset search page.

        This template is used to render each dataset that is listed in the
        search results on the dataset search page.

        The path should be relative to the plugin's templates dir, e.g.
        ``'package/search.html'``.

        :rtype: string

        '''
        return 'ckanext/dgulocal/search.html'

    def history_template(self):
        '''Return the path to the template for the dataset history page.

        The path should be relative to the plugin's templates dir, e.g.
        ``'package/history.html'``.

        :rtype: string
        '''
        return ""

    def package_form(self):
        '''Return the path to the template for the dataset form.

        The path should be relative to the plugin's templates dir, e.g.
        ``'package/form.html'``.

        :rtype: string

        '''
        return ""

    def validate(self, context, data_dict, schema, action):
        """Customize validation of datasets.

        When this method is implemented it is used to perform all validation
        for these datasets. The default implementation calls and returns the
        result from ``ckan.plugins.toolkit.navl_validate``.

        This is an adavanced interface. Most changes to validation should be
        accomplished by customizing the schemas returned from
        ``show_package_schema()``, ``create_package_schema()``
        and ``update_package_schama()``. If you need to have a different
        schema depending on the user or value of any field stored in the
        dataset, or if you wish to use a different method for validation, then
        this method may be used.

        :param context: extra information about the request
        :type context: dictionary
        :param data_dict: the dataset to be validated
        :type data_dict: dictionary
        :param schema: a schema, typically from ``show_package_schema()``,
          ``create_package_schema()`` or ``update_package_schama()``
        :type schema: dictionary
        :param action: ``'package_show'``, ``'package_create'`` or
          ``'package_update'``
        :type action: string
        :returns: (data_dict, errors) where data_dict is the possibly-modified
          dataset and errors is a dictionary with keys matching data_dict
          and lists-of-string-error-messages as values
        :rtype: (dictionary, dictionary)
        """
