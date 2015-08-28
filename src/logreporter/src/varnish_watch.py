#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
This script reads from stdin and expects the input to be the output from
running

    varnishlog -o | perl -ne 'BEGIN { $/ = "";} print if (/TxStatus.*(50\d)/);'

which will return blocks this is a logged 503.  The script then parses the lines
looking for ones that we want to write to our own logfile in something resembling
our python format. It's a simple state machine where we need to make sure we know
what state the current read is in.
"""
import os
import re
import signal
import sys
import time

from dateutil import parser as date_parser

# This is our state machine, for each current_state (key) we also store the regex
# to match, the field name to set and the next state (should the regex match)

STATES = {
# state,  regex,                               field_to_set, next_state
    0: (re.compile('.*ReqStart.*c (.*?)\s+.*'), "ip_address", 1),
    1: (re.compile('.*RxURL.*c (.*)'),          "url",        2),
    2: (re.compile('.*TxHeader.*Date: (.*)'),   "date",       3),
    3: (re.compile('.*TxHeader.*X-App: (.*)'),  "backend",    4),
    4: (re.compile('.*(ReqEnd).*'), "", 0),
}

def write_record(record):
    # 2013-07-01 05:07:34,744 DEBUG [ckanext.dgu.search_indexing] Error
    dt = date_parser.parse(record['date'])
    record['date'] = dt.strftime("%Y-%m-%d %H:%M:%S,%f")
    sys.stdout.write("{date} ERROR [varnish] {url} from {ip_address} generated a 503 for {backend}".format(**record))
    sys.stdout.write('\n')

def signal_handler(signal, frame):
        sys.exit(0)

def watch():
    # Cleanly handle ctrl-C
    signal.signal(signal.SIGINT, signal_handler)

    current_state = 0
    current_dict = {}
    line = sys.stdin.readline().strip()
    while len(line) > 0:
        # Based on state, process the current line
        match = STATES[current_state][0].match(line)
        if match:
            # If we have a match, then pull the value from the regex match
            val = match.groups(0)[0]
            field = STATES[current_state][1]

            # If we have a field (all except the end) then we should set it
            # in the current dict.  If not then we have finished this block
            # and should process it before starting another.
            if field:
                current_dict[field] = val
            else:
                write_record(current_dict)
                current_dict = {}

            # Move to the next state
            current_state = STATES[current_state][2]

        line = sys.stdin.readline().strip()
        while len(line) == 0:
            # Keep reading after sleeping for a short while.
            time.sleep(0.5)
            line = sys.stdin.readline().strip()





