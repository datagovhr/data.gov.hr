#!/bin/bash
##
# This script does the setup for the command and just has varnish-watch write to
# stdout. It is up to the caller to either redirect stdout, or allow supervisord
# to that on our behalf.
##
varnishlog -o | perl -ne 'BEGIN { $/ = "";} print if (/TxStatus.*(50\d)/);' | $CKAN_ENV/bin/varnish-watch
