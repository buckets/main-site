#!/usr/bin/env python
from __future__ import print_function
import requests
import os
from collections import defaultdict


GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')

# Get the most recent N releases
number = 5
r = requests.get('https://api.github.com/repos/buckets/application/releases',
    auth=(GH_USER, GH_TOKEN))
releases = r.json()
for release in releases[:number]:
    name = release['name']
    dlcount = defaultdict(lambda:0)
    for asset in release['assets']:
        asset_name = asset['name']
        if asset_name == 'latest-mac.yml':
            continue
        dlcount[asset_name] += asset['download_count']
    total = sum(dlcount.values())
    parts = []
    for k in sorted(dlcount):
        v = dlcount[k]
        if v:
            parts.append('{v} {k}'.format(**locals()))
    print('\n{version} tot={total}'.format(
        version=name,
        total=total))
    for part in parts:
        print('  {part}'.format(part=part))
