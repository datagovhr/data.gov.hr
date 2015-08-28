#!/usr/bin/env python

"""
logreporter.py scans log files for recent error messages and emails out
a report of them.
"""
import os, sys
import datetime
import itertools
import smtplib
import argparse
from email.mime.text import MIMEText
from socket import gethostname

from reporter import check_log_file, filter_date
from dateutil import parser as date_parser
from template import (generate_header, generate_block, generate_footer)

def get_parser():
    parser = argparse.ArgumentParser(usage=__doc__)
    parser.add_argument("-l", "--logs",
                        help="comma-separated list of log files to scan")
    parser.add_argument("-s", "--sender",
                        help="email address of sender")
    parser.add_argument("-r", "--recipients",
                        help="comma-separated list of email recipients (if none, the report go to stdout)")
    parser.add_argument("--server",
                        help="The address:port of the mail server")
    parser.add_argument("--hours", type=int, default=24,
                        help="Accepts log messages from the previous X hours")

    return parser


def main():
    parser = get_parser()
    args = parser.parse_args()
    if not args.logs:
        print "ERROR Log files required - specify a comma-separated list with -l"
        parser.print_help()
        sys.exit(1)

    text_blocks = []

    hostname = gethostname()
    rundate = datetime.datetime.now()

    for logfile in args.logs.split(','):
        if not os.path.exists(logfile):
            print "Failed to find file: {f}".format(f=logfile)
            continue

        with open(logfile, 'r') as f:
            items = check_log_file(f)
            items = itertools.ifilter(filter_date(args.hours, now=rundate), items)
            block = generate_block(logfile, list(items))
            text_blocks.append(block)

    header = generate_header(rundate, server=hostname)
    footer = generate_footer()
    msg_body = "".join([header] + text_blocks + [footer])

    if not args.recipients:
        print msg_body
        sys.exit(0)

    sender = args.sender if args.sender else "root@{0}".format(hostname)
    msg = MIMEText(msg_body)
    msg['Subject'] = "[LOG REPORT] {0}".format(hostname)
    msg['From'] = sender
    msg['To'] = args.recipients

    s = smtplib.SMTP(args.server or "localhost:1025")
    s.sendmail(sender, args.recipients.split(','), msg.as_string())
    s.quit()
