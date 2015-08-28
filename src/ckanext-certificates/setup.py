from setuptools import setup, find_packages
import sys, os

version = '0.1'

setup(
	name='ckanext-certificates',
	version=version,
	description="Integration with the ODI's Open Data Certificates",
	long_description="""\
	""",
	classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
	keywords='',
	author='Ross Jones',
	author_email='ross@servercode.co.uk',
	url='https://github.com/datagovuk/ckanext-certificates',
	license='',
	packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
	namespace_packages=['ckanext', 'ckanext.certificates'],
	include_package_data=True,
	zip_safe=False,
	install_requires=[
	    "requests>=1.1.0",
	    "lxml"
	],
	entry_points=\
	"""
    [paste.paster_command]
    fetch_certs = ckanext.certificates.commands:CertificateCommand

    [ckan.plugins]
	certificates=ckanext.certificates.plugin:CertificatesPlugin
	""",
)
