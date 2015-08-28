import logging
import datetime

from sqlalchemy import event
from sqlalchemy import distinct
from sqlalchemy import Table
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import types
from sqlalchemy.engine.reflection import Inspector
from sqlalchemy.orm import backref, relation

from ckan import model
from ckan.model.meta import metadata,  mapper, Session
from ckan.model.types import make_uuid
from ckan.model.domain_object import DomainObject
from ckan.model.package import Package





log = logging.getLogger(__name__)

__all__ = [
    'HarvestSource', 'harvest_source_table',
    'HarvestJob', 'harvest_job_table',
    'HarvestObject', 'harvest_object_table',
    'HarvestGatherError', 'harvest_gather_error_table',
    'HarvestObjectError', 'harvest_object_error_table',
    'HarvestCoupledResource', 'harvest_coupled_resource_table',
]


harvest_source_table = None
harvest_job_table = None
harvest_object_table = None
harvest_gather_error_table = None
harvest_object_error_table = None
harvest_coupled_resource_table = None

def setup():

    if harvest_source_table is None:
        define_harvester_tables()
        log.debug('Harvest tables defined in memory')

    if model.package_table.exists():
        if not harvest_source_table.exists():

            # Create each table individually rather than
            # using metadata.create_all()
            harvest_source_table.create()
            harvest_job_table.create()
            harvest_object_table.create()
            harvest_gather_error_table.create()
            harvest_object_error_table.create()
            harvest_coupled_resource_table.create()

            log.debug('Harvest tables created')
        else:
            from ckan.model.meta import engine
            log.debug('Harvest tables already exist')
            # Check if existing tables need to be updated
            inspector = Inspector.from_engine(engine)
            columns = inspector.get_columns('harvest_source')
            if not 'title' in [column['name'] for column in columns]:
                log.debug('Harvest tables updating to v2')
                migrate_v2()
            columns = inspector.get_columns('harvest_object')
            if not 'harvest_source_reference' in [column['name'] for column in columns]:
                log.debug('Harvest tables updating to v3_dgu')
                migrate_v3_dgu()

    else:
        log.debug('Harvest table creation deferred')


class HarvestDomainObject(DomainObject):
    '''Convenience methods for searching objects
    '''
    key_attr = 'id'

    @classmethod
    def get(cls, key, default=None, attr=None):
        '''Finds a single entity in the register.'''
        if attr == None:
            attr = cls.key_attr
        kwds = {attr: key}
        o = cls.filter(**kwds).first()
        if o:
            return o
        else:
            return default

    @classmethod
    def filter(cls, **kwds):
        query = Session.query(cls).autoflush(False)
        return query.filter_by(**kwds)


class HarvestSource(HarvestDomainObject):
    '''A Harvest Source is essentially a URL plus some other metadata.
       It must have a type (e.g. CSW) and can have a status of "active"
       or "inactive". The harvesting processes are not fired on inactive
       sources.
    '''
    def __repr__(self):
        return '<HarvestSource id=%s title=%s url=%s active=%r>' % \
               (self.id, self.title, self.url, self.active)
    def __str__(self):
        return str(self.__repr__())

class HarvestJob(HarvestDomainObject):
    '''A Harvesting Job is performed in two phases. In first place, the
       **gather** stage collects all the Ids and URLs that need to be fetched
       from the harvest source. Errors occurring in this phase
       (``HarvestGatherError``) are stored in the ``harvest_gather_error``
       table. During the next phase, the **fetch** stage retrieves the
       ``HarvestedObjects`` and, if necessary, the **import** stage stores
       them on the database. Errors occurring in this second stage
       (``HarvestObjectError``) are stored in the ``harvest_object_error``
       table.
    '''
    def __repr__(self):
        return '<HarvestJob id=%s source_id=%s status=%s created=%r>' % \
               (self.id, self.source_id, self.status, self.created.strftime('%Y-%m-%d %H:%M'))
    def __str__(self):
        return str(self.__repr__())

class HarvestObject(HarvestDomainObject):
    '''A Harvest Object is created every time an element is fetched from a
       harvest source. Its contents can be processed and imported to ckan
       packages, RDF graphs, etc.

    '''
    def __repr__(self):
        return '<HarvestObject id=%s guid=%s current=%r content=%s... package_id=%s>' % \
               (self.id, self.guid, self.current,
                self.content[:10] if self.content else '', self.package_id)
    def __str__(self):
        return str(self.__repr__())

class HarvestGatherError(HarvestDomainObject):
    '''Gather errors are raised during the **gather** stage of a harvesting
       job.
    '''
    pass

class HarvestObjectError(HarvestDomainObject):
    '''Object errors are raised during the **fetch** or **import** stage of a
       harvesting job, and are referenced to a specific harvest object.
    '''
    pass

class HarvestCoupledResource(HarvestDomainObject):
    '''A Harvest Coupled Resource aims to link two packages - a service record
    and a dataset record (or series record).

    Both packages have embedded in them the details of the value for the
    harvest_source_reference, and this table exposes them.
    The value of the harvest_source_reference is determined by the metadata
    standard:
    * INSPIRE says it is the Unique Resource Locator of the metadata
    * Gemini2 says it is the CSW GetRecordById URL, or WAF metadata file URL

    When a service record is harvested, for each couple\'s
    harvest_source_reference and service_record_package_id combination there
    should be one HarvestCoupledResource object.

    When a dataset or series record is harvested, for its
    harvest_source_reference and datset_record_package_id combination there
    should be a HarvestCoupledResource object.

    Once all records are harvested, all HarvestCoupledResource objects should
    have both service_record_package_id and dataset_record_package_id values
    filled in, detailing all the couplings.
    '''
    def __repr__(self):
        dataset_record = self.dataset_record_package_id
        if dataset_record:
            dataset = model.Package.get(dataset_record)
            if dataset:
                dataset_record = dataset.name
        service_record = self.service_record_package_id
        if service_record:
            service = model.Package.get(service_record)
            if service:
                service_record = service.name
        return '<HarvestObject id=%s dataset_record=%s harvest_source_reference=%s dataset_record=%s>' % \
               (self.id, dataset_record, self.harvest_source_reference,
                service_record)
    def __str__(self):
        return str(self.__repr__())

    @classmethod
    def get_by_harvest_source_reference(cls, harvest_source_reference):
        return Session.query(HarvestCoupledResource) \
               .filter_by(harvest_source_reference=harvest_source_reference)

    @classmethod
    def get_by_service_record(cls, service_record_package):
        return Session.query(HarvestCoupledResource) \
               .filter_by(service_record=service_record_package)

    @classmethod
    def get_by_dataset_record(cls, dataset_record_package):
        return Session.query(HarvestCoupledResource) \
               .filter_by(dataset_record=dataset_record_package)

def harvest_object_before_insert_listener(mapper,connection,target):
    '''
        For compatibility with old harvesters, check if the source id has
        been set, and set it automatically from the job if not.
    '''
    if not target.harvest_source_id or not target.source:
        if not target.job:
            raise Exception('You must define a Harvest Job for each Harvest Object')
        target.source = target.job.source
        target.harvest_source_id = target.job.source.id


def define_harvester_tables():

    global harvest_source_table
    global harvest_job_table
    global harvest_object_table
    global harvest_gather_error_table
    global harvest_object_error_table
    global harvest_coupled_resource_table

    harvest_source_table = Table('harvest_source', metadata,
        Column('id', types.UnicodeText, primary_key=True, default=make_uuid),
        Column('url', types.UnicodeText, nullable=False),
        Column('title', types.UnicodeText, default=u''),
        Column('description', types.UnicodeText, default=u''),
        Column('config', types.UnicodeText, default=u''),
        Column('created', types.DateTime, default=datetime.datetime.utcnow),
        Column('type',types.UnicodeText,nullable=False),
        Column('active',types.Boolean,default=True),
        Column('user_id', types.UnicodeText, default=u''),
        Column('publisher_id', types.UnicodeText, default=u''),
    )
    # Was harvesting_job
    harvest_job_table = Table('harvest_job', metadata,
        Column('id', types.UnicodeText, primary_key=True, default=make_uuid),
        Column('created', types.DateTime, default=datetime.datetime.utcnow),
        Column('gather_started', types.DateTime),
        Column('gather_finished', types.DateTime),
        Column('source_id', types.UnicodeText, ForeignKey('harvest_source.id')),
        Column('status', types.UnicodeText, default=u'New', nullable=False),
    )
    # Was harvested_document
    harvest_object_table = Table('harvest_object', metadata,
        Column('id', types.UnicodeText, primary_key=True, default=make_uuid),
        Column('guid', types.UnicodeText, default=u''),
        Column('current',types.Boolean,default=False),
        Column('gathered', types.DateTime, default=datetime.datetime.utcnow),
        Column('fetch_started', types.DateTime),
        Column('content', types.UnicodeText, nullable=True),
        Column('fetch_finished', types.DateTime),
        Column('metadata_modified_date', types.DateTime),
        Column('retry_times',types.Integer),
        Column('harvest_job_id', types.UnicodeText, ForeignKey('harvest_job.id')),
        Column('harvest_source_id', types.UnicodeText, ForeignKey('harvest_source.id')),
        Column('harvest_source_reference', types.UnicodeText), # id according to the Harvest Source, for Gemini Coupled Resources
        Column('package_id', types.UnicodeText, ForeignKey('package.id'), nullable=True),
    )
    # New table
    harvest_gather_error_table = Table('harvest_gather_error',metadata,
        Column('id', types.UnicodeText, primary_key=True, default=make_uuid),
        Column('harvest_job_id', types.UnicodeText, ForeignKey('harvest_job.id')),
        Column('message', types.UnicodeText),
        Column('created', types.DateTime, default=datetime.datetime.utcnow),
    )
    # New table
    harvest_object_error_table = Table('harvest_object_error',metadata,
        Column('id', types.UnicodeText, primary_key=True, default=make_uuid),
        Column('harvest_object_id', types.UnicodeText, ForeignKey('harvest_object.id')),
        Column('message',types.UnicodeText),
        Column('stage', types.UnicodeText),
        Column('created', types.DateTime, default=datetime.datetime.utcnow),
    )
    harvest_coupled_resource_table = Table('harvest_coupled_resource',metadata,
        Column('id', types.UnicodeText, primary_key=True, default=make_uuid),
        Column('service_record_package_id', types.UnicodeText, ForeignKey('package.id'), nullable=True),
        Column('harvest_source_reference', types.UnicodeText, nullable=False),
        Column('dataset_record_package_id', types.UnicodeText, ForeignKey('package.id'), nullable=True),
    )

    mapper(
        HarvestSource,
        harvest_source_table,
        properties={
            'jobs': relation(
                HarvestJob,
                lazy=True,
                backref=u'source',
                order_by=harvest_job_table.c.created,
            ),
        },
    )

    mapper(
        HarvestJob,
        harvest_job_table,
    )

    mapper(
        HarvestObject,
        harvest_object_table,
        properties={
            'package':relation(
                Package,
                lazy=True,
                backref='harvest_objects',
            ),
            'job': relation(
                HarvestJob,
                lazy=True,
                backref=u'objects',
            ),
            'source': relation(
                HarvestSource,
                lazy=True,
                backref=u'objects',
            ),

        },
    )

    mapper(
        HarvestGatherError,
        harvest_gather_error_table,
        properties={
            'job':relation(
                HarvestJob,
                backref='gather_errors'
            ),
        },
    )

    mapper(
        HarvestObjectError,
        harvest_object_error_table,
        properties={
            'object':relation(
                HarvestObject,
                backref='errors'
            ),
        },
    )

    mapper(
        HarvestCoupledResource,
        harvest_coupled_resource_table,
        properties={
            'service_record':relation(
                Package,
                primaryjoin=harvest_coupled_resource_table.c.service_record_package_id == Package.id,
                lazy=True,
                backref='coupled_dataset',
            ),
            'dataset_record':relation(
                Package,
                primaryjoin=harvest_coupled_resource_table.c.dataset_record_package_id == Package.id,
                lazy=True,
                backref='coupled_service',
            ),
        },
    )

    event.listen(HarvestObject, 'before_insert', harvest_object_before_insert_listener)

def migrate_v2():
    log.debug('Migrating harvest tables to v2. This may take a while...')
    conn = Session.connection()

    statements = '''
    ALTER TABLE harvest_source ADD COLUMN title text;

    ALTER TABLE harvest_object ADD COLUMN current boolean;
    ALTER TABLE harvest_object ADD COLUMN harvest_source_id text;
    ALTER TABLE harvest_object ADD CONSTRAINT harvest_object_harvest_source_id_fkey FOREIGN KEY (harvest_source_id) REFERENCES harvest_source(id);

    UPDATE harvest_object o SET harvest_source_id = j.source_id FROM harvest_job j WHERE o.harvest_job_id = j.id;
    '''
    conn.execute(statements)

    # Flag current harvest_objects
    guids = Session.query(distinct(HarvestObject.guid)) \
            .join(Package) \
            .filter(HarvestObject.package!=None) \
            .filter(Package.state==u'active')

    update_statement = '''
    UPDATE harvest_object
    SET current = TRUE
    WHERE id = (
        SELECT o.id
        FROM harvest_object o JOIN package p ON p.id = o.package_id
        WHERE o.package_id IS NOT null AND p.state = 'active'
            AND o.guid = '%s'
        ORDER BY metadata_modified_date DESC, fetch_finished DESC, gathered DESC
        LIMIT 1)
    '''

    for guid in guids:
        conn.execute(update_statement % guid)

    conn.execute('UPDATE harvest_object SET current = FALSE WHERE current IS NOT TRUE')

    Session.commit()
    log.info('Harvest tables migrated to v2')

def migrate_v3_dgu():
    log.debug('Migrating harvest tables to v3_dgu.')
    conn = Session.connection()
    statement = 'ALTER TABLE harvest_object ADD COLUMN harvest_source_reference text;'
    conn.execute(statement)
    update_statement = '''
    UPDATE harvest_object
    SET harvest_source_reference = guid
    '''
    conn.execute(update_statement)
    # This is fine for CSWs, but any WAFs will need a manual migration using
    # coupled_resources.py, since the WAF ids don\'t exist in the tables.

    harvest_coupled_resource_table.create()

    Session.commit()
    log.info('Harvest tables migrated to v3_dgu')
