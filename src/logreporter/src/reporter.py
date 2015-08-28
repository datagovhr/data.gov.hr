import re
import datetime
from dateutil import parser as date_parser


line_matcher = re.compile("^(\d+-\d+-\d+) (\d+:\d+:\d+),\d+ (\w+)\s*\[(.*)\] (.*)")
syslog_matcher = re.compile("^\w+\s{1,2}\d+ \d+:\d+:\d+ .* (\d+-\d+-\d+) (\d+:\d+:\d+),\d+ (\w+)\s*\[(.*)\] (.*)")

def load_data(datalist):
    data = {"extra": ""}
    data['when'] = date_parser.parse("%s %s" % datalist[0:2])
    data['level'] = datalist[2]
    data['who'] = datalist[3]
    data['message'] = datalist[4]
    data['appeared'] = 1
    return data

def check_log_file(f, matches=["ERROR"]):
    """ Loops through the file and checks each line for matches that we
        may be interested in and yields them to the caller """
    last = None
    while True:
        line = f.readline()
        if not line:
            break

        m = line_matcher.match(line) or syslog_matcher.match(line)
        if m:
            if m.groups(0)[2] in matches:
                if last:
                    yield last
                last = load_data(m.groups(0))
            elif last:
                yield last
                last = None
        else:
            # Not a match, but we potentially have a previous dict to add to
            if last:
                last['extra'] = last.get("extra","") + line
    if last:
        yield last

def filter_date(hours, now=datetime.datetime.now()):
    """ Returns a function (using the allowed date as a closure) suitable for
        use by filter() or ifilter() """
    allowed = now - datetime.timedelta(hours=hours if hours > 0 else 100000)
    def _filter(element):
        return element['when'] >= allowed
    return _filter
