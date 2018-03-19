#!/usr/bin/env python
from __future__ import print_function
import requests
import os
from collections import defaultdict
from datetime import datetime


GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')

def getReleaseDate(release):
    d = release.get('published_at', None)
    if d:
        return datetime.strptime(d, "%Y-%m-%dT%H:%M:%SZ")

SECONDS_PER_DAY = 60 * 60 * 24

def perday(num, seconds):
    if seconds < (SECONDS_PER_DAY / 2):
        return 0
    return 1.0 * num * SECONDS_PER_DAY / seconds

# Get the most recent N releases
number = 10
r = requests.get('https://api.github.com/repos/buckets/application/releases',
    auth=(GH_USER, GH_TOKEN))
releases = r.json()
releases = list(reversed(releases[:number]))
for i,release in enumerate(releases):
    try:
        next_release = releases[i+1]
    except Exception as e:
        next_release = None

    name = release['name']
    seconds = 1

    # get time it was published
    published = getReleaseDate(release)
    if published:
        if next_release:
            next_published = getReleaseDate(next_release) or datetime.now()
            seconds = (next_published - published).total_seconds()
        else:
            seconds = (datetime.now() - published).total_seconds()
    if not seconds:
        seconds = 1
    seconds *= 1.0
    dlcount = defaultdict(lambda:0)
    for asset in release['assets']:
        asset_name = asset['name']
        if asset_name.endswith('.yml') or asset_name.endswith('.json'):
            asset_name = 'OPENED'
        dlcount[asset_name] += asset['download_count']
    total = sum(dlcount.values()) - dlcount.get('OPENED', 0)
    parts = []
    for k in sorted(dlcount):
        v = dlcount[k]
        if v:
            parts.append('%4d %4d/d %s' % (v, perday(v,seconds), k))
    print('\nv%s -- %s (%.2f days)' % (
            name,
            published.isoformat(),
            seconds/SECONDS_PER_DAY))
    for part in parts:
        print('  {part}'.format(part=part))
    print('  %4d %4d/d total' % (total, perday(total,seconds)))
