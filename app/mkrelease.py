#!/usr/bin/env python
from __future__ import print_function

import sys
import os
import subprocess
import json
import io
import requests

GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')

def prompt(text, default=None, validate=lambda x:x, required=True):
    full_prompt = text
    if default is not None:
        full_prompt = '{0} [{1}]'.format(full_prompt, default)
    while True:
        answer = validate(raw_input(full_prompt + ' '))
        if not answer and not default and required:
            continue
        else:
            return answer or default

def yesno(text, default=None):
    if default is True:
        text += ' [Y/n]'
    elif default is False:
        text += ' [y/N]'
    else:
        text += ' [y/n]'
    while True:
        answer = raw_input(text + ' ')
        if not answer and default is None:
            continue
        elif not answer and default is not None:
            return default
        else:
            if answer.lower().startswith('y'):
                return True
            elif answer.lower().startswith('n'):
                return False
            else:
                continue

def getPackageVersion():
    with io.open('package.json') as fh:
        package = json.load(fh)
    return package['version']

def updatePackageVersion(version):
    lines = []
    with io.open('package.json', 'r') as fh:
        for line in fh:
            if line.count('"version": '):
                line = '  "version": "{0}",'.format(version)
            lines.append(line)

    with io.open('package.json', 'w') as fh:
        fh.write('\n'.join(lines))

def getLatestReleaseVersion():
    r = requests.get('https://api.github.com/repos/buckets/application/releases',
        auth=(GH_USER, GH_TOKEN))
    releases = r.json()
    for release in releases:
        if release['draft']:
            continue
        return release['name']

def abort():
    sys.stderr.write('Aborting...\n')
    sys.exit(1)



# choose version
package_version = getPackageVersion()
guess_target_version = package_version
if guess_target_version.count('-'):
    guess_target_version = guess_target_version.split('-')[0]
latest_version = getLatestReleaseVersion()
print('package.json version:', package_version)
print('Latest released version on GitHub:', latest_version)
target_version = prompt('Version to release?',
    default=guess_target_version)

# verify CHANGELOG
print('=== CHANGELOG ===')
subprocess.check_call(['dev/changelog/combine_changes.sh'])
if not yesno('Does this look correct?', default=True):
    abort()

# update version
updatePackageVersion(target_version)
print('Updated package.json version to {0}'.format(target_version))

# update CHANGELOG
subprocess.check_call(['dev/changelog/updatechangelog.sh'])
print('Updated CHANGELOG')
