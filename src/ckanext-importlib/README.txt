Library for importing datasets into CKAN using the API.

Introduction
============

One-off imports of metadata into CKAN isn't very hard, and using ckanclient directly is probably best for that. But when you are continuously importing you have some challenges which this library aims to help with:

* when you reimport a dataset you want to check if it already exists in CKAN, using an ID stored in an extra field and possibly another extra field naming the source

* you may import resources, which become grouped into datasets (e.g. time series data) - ResourceSeriesLoader

* when you derive a unique name for a dataset from its title, you need to avoid clashes.

ckanext-importlib was designed as a framework to be expanded, based on the needs of the data.gov.uk ONS importer. But TBH it is not so flexible. But even if you don't use it, you might want to steal stuff from it.

Quickstart
==========

To get the code::

    hg clone https://github.com/okfn/ckanext-importlib.git

The code also requires installed:
 * importlib dependencies (pip-requirements.txt)
 * ckan
 * ckan dependencies (ckan/pip-requirements.txt)

To install the dependencies into a virtual environment::

    virtualenv pyenv
    pip -E pyenv install -e ../ckanext-importlib
    pip -E pyenv install -e ckan
    pip -E ../pyenv-ckanext-importlib install -r ../ckan/pip-requirements.txt
    pip -E pyenv install -r pip-requirements.txt


Tests
=====

To run the tests:: 

    pip -E pyenv install -e nose
    cd ckanext-importlib
    nosetests --ckan ckanext/importlib/tests/
