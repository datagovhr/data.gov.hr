from setuptools import setup, find_packages


setup(
    name='logreporter',
    version="1.0",
    long_description="""\
""",
    classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
    namespace_packages=[],
    zip_safe=False,
    author='Ross Jones',
    author_email='ross@servercode.co.uk',
    license='AGPL',
    url='',
    description='''Collection of scripts for processing log files in DGUK''',
    keywords='varnish logging',
    install_requires=[
        "dateutils"
    ],
    packages=find_packages(exclude=['ez_setup']),
    include_package_data=True,
    package_data={'ckan': ['i18n/*/LC_MESSAGES/*.mo']},
    entry_points="""
    [console_scripts]
    varnish-watch = src.varnish_watch:watch
    log-reporter = src.logreporter:main
""",
    test_suite = 'nose.collector',
)