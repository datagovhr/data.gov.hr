import os

import ckanext.dgulocal.lib.services as services

from nose.tools import assert_equal


class TestServiceList:

    def test_lookup(self):
        d = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data"))
        f = os.path.join(d, "functions_services.xml")

        contents = open(f, 'r').read()
        data = services._load_functions_services(contents)

        assert_equal(len(data), 2)
        assert_equal(len(data.get('functions',{})), 113)
        assert_equal(len(data.get('services',{})), 1127)
