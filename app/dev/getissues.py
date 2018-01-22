#!/usr/bin/env python
import json
import os
import io
import requests


GH_USER = os.environ.get('GH_USERNAME', 'iffy')
GH_TOKEN = os.environ['GH_TOKEN']
REPO = 'buckets/application'
AUTH = (GH_USER, GH_TOKEN)


def getIssues():
    url = 'https://api.github.com/repos/%s/issues' % REPO
    while url:
        r = requests.get(url, auth=AUTH)
        if not r.ok:
            raise Exception(r.text)

        for issue in r.json():
            comments = list(getComments(issue['comments_url']))
            yield {
                'issue': issue,
                'comments': comments,
            }

        if r.links and 'next' in r.links:
            url = r.links['next']['url']
        else:
            url = None


def getComments(url):
    while url:
        r = requests.get(url, auth=AUTH)
        if not r.ok:
            raise Exception(r.text)

        for comment in r.json():
            yield comment

        if r.links and 'next' in r.links:
            url = r.links['next']['url']
        else:
            url = None


all_issues = list(getIssues())
with io.open(os.path.expanduser('~/Desktop/buckets_issues.json'), 'wb') as fh:
    fh.write(json.dumps(all_issues, indent=2))

