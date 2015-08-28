import os
pyenv_bin_dir = '/home/co/ckan/bin'
config_filepath = '/var/ckan/ckan.ini'
activate_this = os.path.join(pyenv_bin_dir, 'activate_this.py')
execfile(activate_this, dict(__file__=activate_this))
from paste.deploy import loadapp
from paste.script.util.logging_config import fileConfig
fileConfig(config_filepath)
application = loadapp('config:%s' % config_filepath)
from ckanext.dgu.bin.url_space_sharer import UrlSpaceSharer
application = UrlSpaceSharer(application)
