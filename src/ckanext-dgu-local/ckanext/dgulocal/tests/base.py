'''
All tests that use PostGIS need to inherit from SpatialTestBase to get the
geometry_columns and spatial_ref_sys tables.

This is adapted from ckanext-spatial/ckanext/spatial/tests/base.py
'''

import os
import re

from sqlalchemy import Table
from nose.plugins.skip import SkipTest

from ckan.model import Session, repo, meta, engine_is_sqlite


def setup_postgis_tables():

    conn = Session.connection()
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               'scripts', 'postgis.sql')
    script = open(script_path, 'r').read()
    for cmd in script.split(';'):
        cmd = re.sub(r'--(.*)|[\n\t]', '', cmd)
        if len(cmd):
            conn.execute(cmd)

    Session.commit()


class SpatialTestBase:

    @classmethod
    def setup_class(cls):
        if engine_is_sqlite():
            raise SkipTest("PostGIS is required for this test")

        # This will create the PostGIS tables (geometry_columns and
        # spatial_ref_sys) which were deleted when rebuilding the database
        table = Table('geometry_columns', meta.metadata)
        if not table.exists():
            setup_postgis_tables()

    @classmethod
    def teardown_class(cls):
        repo.rebuild_db()
