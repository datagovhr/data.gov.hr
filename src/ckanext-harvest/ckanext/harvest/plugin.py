import os
from logging import getLogger

from pylons import config
from genshi.input import HTML
from genshi.filters import Transformer

import ckan.lib.helpers as h

from ckan.plugins import implements, SingletonPlugin
from ckan.plugins import IRoutes, IConfigurer
from ckan.plugins import IConfigurable, IActions, IAuthFunctions
from ckanext.harvest.model import setup as model_setup

log = getLogger(__name__)
assert not log.disabled

class Harvest(SingletonPlugin):

    implements(IConfigurable)
    implements(IRoutes, inherit=True)
    implements(IConfigurer, inherit=True)
    implements(IActions)
    implements(IAuthFunctions)

    def configure(self, config):

        # Setup harvest model
        model_setup()

    def before_map(self, map):

        controller = 'ckanext.harvest.controllers.view:ViewController'
        map.redirect('/harvest/', '/harvest') # because there are relative links
        map.connect('harvest', '/harvest',controller=controller,action='index')

        map.connect('/harvest/new', controller=controller, action='new')
        map.connect('/harvest/edit/:id', controller=controller, action='edit')
        map.connect('/harvest/delete/:id',controller=controller, action='delete')
        map.connect('/harvest/:id', controller=controller, action='read')

        map.connect('harvesting_job_create', '/harvest/refresh/:id',controller=controller,
                action='create_harvesting_job')

        map.connect('/harvest/object/:id', controller=controller, action='show_object')

        return map

    def update_config(self, config):
        here = os.path.dirname(__file__)
        template_dir = os.path.join(here, 'templates')
        public_dir = os.path.join(here, 'public')
        if config.get('extra_template_paths'):
            config['extra_template_paths'] += ',' + template_dir
        else:
            config['extra_template_paths'] = template_dir
        if config.get('extra_public_paths'):
            config['extra_public_paths'] += ',' + public_dir
        else:
            config['extra_public_paths'] = public_dir

    ## IActions

    def get_actions(self):

        module_root = 'ckanext.harvest.logic.action'
        action_functions = _get_logic_functions(module_root)

        return action_functions

    ## IAuthFunctions

    def get_auth_functions(self):

        module_root = 'ckanext.harvest.logic.auth'
        auth_functions = _get_logic_functions(module_root)

        return auth_functions


def _get_logic_functions(module_root, logic_functions={}):

    for module_name in ['get', 'create', 'update', 'delete']:
        module_path = '%s.%s' % (module_root, module_name,)
        module = __import__(module_path)

        for part in module_path.split('.')[1:]:
            module = getattr(module, part)

        for key, value in module.__dict__.items():
            if not key.startswith('_') and  (hasattr(value, '__call__')
                        and (value.__module__ == module_path)):
                logic_functions[key] = value

    return logic_functions
