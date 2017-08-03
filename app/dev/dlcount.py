#!/usr/bin/env python
from __future__ import print_function
import requests
import os


GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')

# Get the most recent N releases
number = 5
r = requests.get('https://api.github.com/repos/buckets/application/releases',
    auth=(GH_USER, GH_TOKEN))
releases = r.json()
for release in releases[:number]:
    name = release['name']
    dlcount = {
        'win': 0,
        'mac': 0,
        'linux': 0,
        'other': 0,
    }
    for asset in release['assets']:
        asset_name = asset['name']
        key = 'other'
        if 'mac' in asset_name:
            key = 'mac'
        elif asset_name.endswith('.dmg'):
            key = 'mac'
        elif asset_name.endswith('.exe'):
            key = 'win'
        elif asset_name.endswith('.deb'):
            key = 'linux'
        dlcount[key] += asset['download_count']
    total = sum(dlcount.values())
    parts = []
    for k in sorted(dlcount):
        v = dlcount[k]
        if v:
            parts.append('{k}={v}'.format(**locals()))
    print('{version} tot={total} {parts}'.format(
        version=name,
        total=total,
        parts=' '.join(parts)))
