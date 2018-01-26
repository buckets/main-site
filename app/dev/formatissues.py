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

with io.open(os.path.expanduser('~/Desktop/buckets_issues.md'), 'wb') as output:
    for issue in sorted(data, key=lambda x:x['issue']['number']):
        output.write('\n')
        title = 'Issue {number} - {title}'.format(
            number=issue['issue']['number'],
            title=issue['issue']['title'])
        output.write('{0}\n{1}\n\n'.format(title, '='*len(title)))
        output.write(issue['issue']['body'].replace('\r', '') + '\n')
        for comment in issue['comments']:
            output.write('\n')
            output.write(comment['body'].replace('\r', '') + '\n')

