from nose.tools import assert_equal

import ckanext.dgulocal.lib.geo as geo
from geoalchemy import WKTSpatialElement
from shapely.geometry import asShape
from ckanext.dgulocal.model import OrganizationExtent
from ckanext.dgulocal.lib.geo import get_boundary


class TestGeo:

    def test_lookup(self):
        import json

        # Peterborough
        b = geo.get_boundary("http://statistics.data.gov.uk/doc/statistical-geography/E06000031")
        assert b is not None

    def test_organization_extent(self):
        import json

        # Peterborough
        geojson = get_boundary("http://statistics.data.gov.uk/doc/statistical-geography/E06000031")

        shape = asShape(geojson)
        w = WKTSpatialElement(shape.wkt, 4326)
        assert w is not None
