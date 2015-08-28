from pylons import url as _pylons_default_url

class HarvestError(Exception):
    pass

def pager_url(ignore=None, page=None):
    # This has params the same as ckan.controllers.Package.pager_url NOT
    # ckan.helpers.pager_url
    routes_dict = _pylons_default_url.environ['pylons.routes_dict']
    kwargs = {}
    kwargs['controller'] = routes_dict['controller']
    kwargs['action'] = routes_dict['action']
    if routes_dict.get('id'):
        kwargs['id'] = routes_dict['id']
    kwargs['page'] = page
    return _pylons_default_url(**kwargs)
