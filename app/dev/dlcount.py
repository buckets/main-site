#!/usr/bin/env python
from __future__ import print_function
import requests
import os
import sys
from collections import defaultdict
from datetime import datetime


GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')
number = 3
if len(sys.argv) >= 2:
    number = int(sys.argv[1])

def getReleaseDate(release):
    d = release.get('published_at', None)
    if d:
        return datetime.strptime(d, "%Y-%m-%dT%H:%M:%SZ")

SECONDS_PER_DAY = 60 * 60 * 24

def perday(num, seconds):
    if seconds < (SECONDS_PER_DAY / 2):
        return 0
    return 1.0 * num * SECONDS_PER_DAY / seconds

def showStats(url):
    # Get the most recent N releases
    r = requests.get(url,
        auth=(GH_USER, GH_TOKEN))
    releases = r.json()
    releases = list(reversed(releases[:number]))
    for i,release in enumerate(releases):
        try:
            next_release = releases[i+1]
        except Exception:
            next_release = None

        name = release['name']
        if release['prerelease']:
            name += ' (BETA)'
        seconds = 1

        # get time it was published
        published = getReleaseDate(release)
        if published:
            if next_release:
                next_published = getReleaseDate(next_release) or datetime.utcnow()
                seconds = (next_published - published).total_seconds()
            else:
                seconds = (datetime.utcnow() - published).total_seconds()
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
                published.isoformat() if published else 'unpublished',
                seconds/SECONDS_PER_DAY))
        for part in parts:
            print('  {part}'.format(part=part))
        print('  %4d %4d/d total' % (total, perday(total,seconds)))


print("BETA")
showStats("https://api.github.com/repos/buckets/desktop-beta/releases")
print("--------------------------------------------")
print("Normal")
showStats("https://api.github.com/repos/buckets/application/releases")

