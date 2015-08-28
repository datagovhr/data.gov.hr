import logging

import ckan.plugins as p


class Command(p.toolkit.CkanCommand):
    """
    DGU Local commands

    Usage::

        paster dgulocal init
           - Creates the database tables that DGU Local requires
    """

    summary = __doc__.split('\n')[0]
    usage = __doc__
    min_args = 0

    def __init__(self, name):
        super(Command, self).__init__(name)

    def command(self):
        """
        Parse command line arguments and call appropriate method.
        """
        if not self.args or self.args[0] in ['--help', '-h', 'help']:
            print Command.__doc__
            return

        cmd = self.args[0]
        self._load_config()

        # Now we can import ckan and create logger, knowing that loggers
        # won't get disabled
        self.log = logging.getLogger('ckanext.dgulocal')

        if cmd == 'init':
            self.init_db()
        else:
            self.log.error('Command "%s" not recognized' % (cmd,))

    def init_db(self):
        import ckan.model as model
        from ckanext.dgulocal.model import init_tables
        init_tables(model.meta.engine)
