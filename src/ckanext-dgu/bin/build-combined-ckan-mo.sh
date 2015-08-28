#!/bin/bash

HERE=`dirname $0`
msgcat --use-first \
    "$HERE/../ckanext/i18n/hr/LC_MESSAGES/ckanext.po" \
    "$HERE/../../ckan/ckan/i18n/hr/LC_MESSAGES/ckan.po" \
    | msgfmt - -o "$HERE/../../ckan/ckan/i18n/hr/LC_MESSAGES/ckan.mo"