#!/usr/bin/env python
from __future__ import print_function

import sys
import os
import re
import subprocess
import json
import io
import requests
import click
import webbrowser

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
                line = '  "version": "{0}",\n'.format(version)
            lines.append(line)

    with io.open('package.json', 'w') as fh:
        fh.write(''.join(lines))

def getLatestReleaseVersion():
    r = requests.get('https://api.github.com/repos/buckets/application/releases',
        auth=(GH_USER, GH_TOKEN))
    releases = r.json()
    for release in releases:
        if release['draft']:
            continue
        return release['name']

r_issuelink = re.compile(r'https://github.com/buckets/application/issues/([0-9]+)')
def extractIssueNumbers(changelog):
    links = r_issuelink.findall(changelog)
    return links

def labelIssue(issue_number, labels):
    r = requests.post('https://api.github.com/repos/buckets/application/issues/{0}/labels'.format(issue_number),
        data=json.dumps(labels),
        auth=(GH_USER, GH_TOKEN))
    if not r.ok:
        raise Exception('Error labelling on issue {0}: {1}'.format(issue_number, r.text))


def commentOnIssue(issue_number, comment):
    r = requests.post('https://api.github.com/repos/buckets/application/issues/{0}/comments'.format(issue_number),
        data=json.dumps({
            'body': comment,
        }),
        auth=(GH_USER, GH_TOKEN))
    if not r.ok:
        raise Exception('Error commenting on issue {0}: {1}'.format(issue_number, r.text))

def closeIssue(issue_number):
    r = requests.patch('https://api.github.com/repos/buckets/application/issues/{0}'.format(issue_number),
        data=json.dumps({
            'state': 'closed',
        }),
        auth=(GH_USER, GH_TOKEN))
    if not r.ok:
        raise Exception('Error closing issue {0}: {1}'.format(issue_number, r.text))

def abort():
    sys.stderr.write('Aborting...\n')
    print('Revert changes with:')
    print('  git checkout -- package.json CHANGELOG.md changes/')
    sys.exit(1)


@click.command()
@click.option('--skip-mac', is_flag=True)
@click.option('--skip-linux', is_flag=True)
@click.option('--skip-win', is_flag=True)
@click.option('--no-publish', is_flag=True)
def doit(no_publish, skip_mac, skip_linux, skip_win):
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
    parts = map(int, target_version.split('.'))
    next_version = '.'.join(map(str, [parts[0], parts[1]+1, 0])) + '-dev'
    next_version = prompt('Next version?',
        default=next_version)

    # verify CHANGELOG
    print('=== CHANGELOG ===')
    new_changelog = subprocess.check_output(['dev/changelog/combine_changes.sh'])
    issue_numbers = extractIssueNumbers(new_changelog)
    print(new_changelog)
    if not yesno('Does this look correct?', default=True):
        abort()

    # update version
    updatePackageVersion(target_version)
    print('[X] Updated package.json version to {0}'.format(target_version))

    # update CHANGELOG
    subprocess.check_call(['dev/changelog/updatechangelog.sh'])
    print('[X] Updated CHANGELOG.')

    if no_publish:
        print('\nSKIPPING PUBLISH\n')
    else:
        # publish
        env = os.environ.copy()
        if skip_win:
            env['SKIP_WIN'] = 'yes'
        if skip_mac:
            env['SKIP_MAC'] = 'yes'
        if skip_linux:
            env['SKIP_LINUX'] = 'yes'
        print('Publishing draft release to GitHub...')
        subprocess.check_call(['./publish.sh'], env=env)
        print('[X] Done uploading to GitHub.')

    # publish CHANGELOG
    subprocess.check_call(['dev/changelog/publishchangelog.py'])
    print('[X] Updated release notes on GitHub')

    # Do some testing
    print('Opening the app for testing...')
    subprocess.check_call(['open', 'dist/mac/Buckets.app'], env={})

    if not yesno('Can you create a new budget?'):
        abort()
    if not yesno('Can you submit a bug report?'):
        abort()
    if not yesno('Can you open your own budget?'):
        abort()

    # Manually publish it
    print('Go to https://github.com/buckets/application/releases to publish the draft')
    webbrowser.open('https://github.com/buckets/application/releases')
    if not yesno('Have you clicked the Publish button on GitHub?'):
        abort()

    # tag it
    if not yesno('Proceed with git commit and tag?', default=True):
        abort()
    subprocess.check_call(['git', 'commit', '-a', '-m', 'Published v{0}'.format(target_version)])
    subprocess.check_call(['git', 'tag', 'v{0}'.format(target_version)])

    # prepare for next version
    updatePackageVersion(next_version)
    subprocess.check_call(['git', 'commit', '-a', '-m', 'Start v{0}'.format(next_version)])
    print('Updated version to {0}'.format(next_version))

    # close issues
    if yesno('Close issues ({0}) on GitHub?'.format(','.join(issue_numbers)), default=True):
        for issue_number in issue_numbers:
            commentOnIssue(issue_number, 'Included in v{0} release'.format(target_version))
            closeIssue(issue_number)


if __name__ == '__main__':
    doit()
