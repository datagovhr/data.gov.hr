from logging import getLogger

from sqlalchemy import types, Column, Table
from geoalchemy import (Geometry, GeometryColumn, GeometryDDL,
                        GeometryExtensionColumn)
from geoalchemy.postgis import PGComparator

from ckan.lib.base import config
from ckan.model import Session
from ckan.model import meta
from ckan.model.domain_object import DomainObject

log = getLogger(__name__)


DEFAULT_SRID = 4326  # (WGS 84)


def init_tables(engine):
    if not Table('geometry_columns', meta.metadata).exists() or \
       not Table('spatial_ref_sys', meta.metadata).exists():
        raise Exception('PostGIS has not been set up in the database. Please '
                        'refer to the "Setting up PostGIS" section in the '
                        'ckanext-spatial README.')

    if not organization_extent_table.exists():
        try:
            organization_extent_table.create()
        except:
            # Make sure the table does not remain incorrectly created
            # (eg without geom column or constraints)
            if organization_extent_table.exists():
                Session.execute('DROP TABLE organization_extent')
                Session.commit()
            raise

        log.debug('organization_extent table created in the db')
    else:
        log.debug('organization_extent table already exists in the db')
        # Future migrations go here


class OrganizationExtent(DomainObject):
    def __init__(self, organization_id=None, the_geom=None):
        self.organization_id = organization_id
        self.the_geom = the_geom


def set_organization_polygon(orgid, geojson):
    from geoalchemy import WKTSpatialElement
    from shapely.geometry import asShape
    from ckanext.dgulocal.model import OrganizationExtent

    if not orgid:
        log.error('No organization provided')
        return

    shape = asShape(geojson)
    extent = Session.query(OrganizationExtent)\
        .filter(OrganizationExtent.organization_id == orgid).first()
    if not extent:
        extent = OrganizationExtent(organization_id=orgid)
    extent.the_geom = WKTSpatialElement(shape.wkt, db_srid)
    extent.save()


db_srid = int(config.get('ckan.spatial.srid', DEFAULT_SRID))

organization_extent_table = Table(
    'organization_extent', meta.metadata,
    Column('organization_id', types.UnicodeText, primary_key=True),
    GeometryExtensionColumn('the_geom', Geometry(2, srid=db_srid))
    )


meta.mapper(OrganizationExtent, organization_extent_table,
            properties={
                'the_geom': GeometryColumn(organization_extent_table.c.the_geom,
                                           comparator=PGComparator)
            })

# enable the DDL extension
GeometryDDL(organization_extent_table)

