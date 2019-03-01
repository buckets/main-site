#!/usr/bin/env python

import os
import requests
import json
import sys

GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')
project_root = os.path.join(os.path.dirname(__file__), '../..')
changelog_filename = os.path.join(project_root, 'CHANGELOG.md')

gh_repo = "buckets/application"

if sys.argv[1] == "beta":
    gh_repo = "buckets/desktop-beta"
else:
    gh_repo = "buckets/application"

# Get block of text
captured = []
with open(changelog_filename, 'rb') as fh:
    state = 'init'
    for line in fh:
        line = line.strip()
        if line.startswith('#'):
            if state == 'init':
                state = 'capturing'
            elif state == 'capturing':
                break
        if state == 'capturing':
            captured.append(line)

block = '\n'.join(captured)
print(block)

# Get the id
r = requests.get('https://api.github.com/repos/{0}/releases'.format(gh_repo),
    auth=(GH_USER, GH_TOKEN))
data = r.json()
latest_release = data[0]
latest_id = latest_release['id']
if not latest_release['draft']:
    raise Exception('We can only update drafts')

# Update the contents
r = requests.patch('https://api.github.com/repos/{0}/releases/{1}'.format(gh_repo, latest_id),
    data=json.dumps({
        'tag_name': latest_release['tag_name'],
        'target_commitish': latest_release['target_commitish'],
        'name': latest_release['name'],
        'body': block,
        'draft': True,
        'prerelease': True,
    }), auth=(GH_USER, GH_TOKEN))
if not r.ok:
    raise Exception(r.text)
else:
    print 'Overwrote release notes body.'