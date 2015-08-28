from setuptools import setup, find_packages

version = '0.1'

setup(
    name='ckanext-dgu-local',
    version=version,
    description="DGU Local Authority Datasets",
    long_description="""\
    """,
    classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
    keywords='',
    author='Ross Jones / David Read',
    author_email='david.read@hackneyworkshop.com',
    url='https://github.com/datagovuk/ckanext-dgu-local',
    license='GPL3',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=['ckanext', 'ckanext.dgulocal'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        "requests>=1.1.0",
        "lxml>=2.2.4",
        "GeoAlchemy>=0.6",
        "Shapely>=1.2.13"
    ],
    entry_points=\
    """
    [ckan.plugins]
    # dgu_local will provide any UI/search enhancements
    dgu_local=ckanext.dgulocal.plugin:LocalPlugin

    # inventory_harvester is used for harvesting from the Inventory format.
    inventory_harvester=ckanext.dgulocal.harvester:InventoryHarvester

    [paste.paster_command]
    dgulocal=ckanext.dgulocal.commands:Command
    """,
)
