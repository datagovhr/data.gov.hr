from setuptools import setup, find_packages

setup(
    name='ckanext-importlib',
    version='0.1',
    author='Open Knowledge Foundation',
    author_email='info@okfn.org',
    license='AGPL',
    url='http://ckan.org/',
    description='CKAN importer and loader library',
    keywords='data packaging component tool server',
    namespace_packages=['ckanext', 'ckanext.importlib'],
    install_requires=[
        # List of dependencies is moved to pip-requirements.txt
        # to avoid conflicts with Debian packaging.
        #'xlrd>=0.7.1',
        #'xlwt>=0.7.2',
    ],
    packages=find_packages(exclude=['ez_setup']),
    include_package_data=True,
    package_data={'ckan': ['i18n/*/LC_MESSAGES/*.mo']},
    entry_points="""
    """,
    test_suite = 'nose.collector',
)
