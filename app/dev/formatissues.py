#!/usr/bin/env python

import io
import sys
import os
import json


try:
    filename = sys.argv[1]
except:
    filename = os.path.expanduser('~/Desktop/buckets_issues.json')

with io.open(filename, 'rb') as fh:
    data = json.loads(fh.read())

for issue in sorted(data, key=lambda x:x['issue']['number']):
    print ''
    title = 'Issue {number} - {title}'.format(
        number=issue['issue']['number'],
        title=issue['issue']['title'])
    print '{0}\n{1}'.format(title, '='*len(title))
    print ''
    print issue['issue']['body'].replace('\r', '')
    for comment in issue['comments']:
        print ''
        print comment['body'].replace('\r', '')
