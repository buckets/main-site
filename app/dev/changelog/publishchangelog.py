#!/usr/bin/env python

import os
import requests
import json

GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')
project_root = os.path.join(os.path.dirname(__file__), '../..')
changelog_filename = os.path.join(project_root, 'CHANGELOG.md')

# Get block of text
tag_name = None
captured = []
with open(changelog_filename, 'rb') as fh:
    state = 'init'
    for line in fh:
        line = line.strip()
        if line.startswith('#'):
            if state == 'init':
                state = 'capturing'
                tag_name = line.split()[1]
            elif state == 'capturing':
                break
        if state == 'capturing':
            captured.append(line)

block = '\n'.join(captured)
print(block)

# Get the id
r = requests.get('https://api.github.com/repos/buckets/application/releases',
    auth=(GH_USER, GH_TOKEN))
data = r.json()
latest_release = data[0]
latest_id = latest_release['id']
if not latest_release['draft']:
    raise Exception('We can only update drafts')

# Update the contents
r = requests.patch('https://api.github.com/repos/buckets/application/releases/{0}'.format(latest_id),
    data=json.dumps({
        'body': block,
    }), auth=(GH_USER, GH_TOKEN))
if not r.ok:
    raise Exception(r.text)
else:
    print 'Overwrote release notes body.'