
transformers = []


def register_transformer(transformer):
    transformers.append(transformer)


def find_transformer(extension=None, mime_type=None):
    if not extension and not mime_type:
        raise ValueError("Either extension or mime type should be specified")

    info = None
    for trans in transformers:
        if extension and extension in trans["extensions"]:
            info = trans
        if mime_type and mime_type in trans["mime_types"]:
            info = trans
    if not info:
        return None

    return info["class"]


def transformer(type_name, resource, url, query):
    """Get transformation module for resource of given type"""
    trans_class = find_transformer(extension=type_name)
    if not trans_class:
        trans_class = find_transformer(extension='*')
    if not trans_class:
        return None

    return trans_class(resource, url, query)


class Transformer(object):
    """Data resource transformer - abstract class"""
    def __init__(self, flow, url, query):
        self.flow = flow
        self.url = url
        self.query = query
        self.open_data = query['handler']
        self.requires_size_limit = True
        self.max_results = 500
        self.mimetype = query.get('mimetype', None)

        if "max-results" in query:
            try:
                self.max_results = int(query.get("max-results", 500))
            except:
                raise ValueError("max-results should be an integer")

        if "audit" in query:
            self.audit = True
        else:
            self.audit = False

    def close_stream(self, handle):
        if handle and hasattr(handle, 'close'):
            handle.close()

    def read_source_rows(self, src):
        rows = []
        record_count = 0

        for row in src.rows():
            rows.append(row)

            record_count += 1
            if self.max_results and record_count >= self.max_results:
                break

        result = {
                    "fields": src.field_names,
                    "data": rows
                  }

        if self.max_results:
            result["max_results"] = self.max_results

        return result
