import logging
from urllib import urlencode

import ckan
from ckan.common import OrderedDict
from pylons import response, config
from ckan import model
from ckan.lib.helpers import flash_notice
from ckan.lib.base import h, BaseController, abort, g
from ckan.lib.search import SearchIndexError
from ckanext.dgu.plugins_toolkit import (render, c, request, _,
    ObjectNotFound, NotAuthorized, ValidationError, get_action, check_access)

log = logging.getLogger(__name__)

from ckanext.dgulocal.lib.services import load_services


class LocalController(ckan.controllers.package.PackageController):
    pass