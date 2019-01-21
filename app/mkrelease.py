#!/usr/bin/env python
from __future__ import print_function

import sys
import os
import re
import subprocess
import json
import pipes
import io
import requests
import click
import webbrowser
from contextlib import contextmanager
from dev.github import GitHubClient

GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')
github = GitHubClient(GH_USER, GH_TOKEN, 'buckets', 'application')


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

def getTopChangelogVersion():
    with io.open('CHANGELOG.md', 'r') as fh:
        for line in fh:
            if line.startswith('##'):
                return line.split()[1][1:]

def getTopChangelog():
    res = []
    capturing = False
    with io.open('CHANGELOG.md', 'r') as fh:
        for line in fh:
            if line.startswith('##'):
                if capturing:
                    break
                else:
                    capturing = True
            else:
                if capturing:
                    res.append(line)
    return ''.join(res)

#------------------------------------------------------------------------------
# GitHub stuff
#------------------------------------------------------------------------------

r_issuelink = re.compile(r'https://github.com/buckets/application/issues/([0-9]+)')
def extractIssueNumbers(changelog):
    links = r_issuelink.findall(changelog)
    return links



#------------------------------------------------------------------------------



def abort():
    sys.stderr.write('Aborting...\n')
    print('Revert changes with:')
    print('  git checkout -- package.json CHANGELOG.md changes/')
    sys.exit(1)


class StepTracker(object):

    def __init__(self, starton=None):
        self.encountered = set()
        self.current = None
        self.starton = starton
        self.started = False
        if starton is None:
            self.started = True

    def __call__(self, name):
        if name in self.encountered:
            raise Exception("Duplicate step name")
        self.encountered.add(name)
        self.current = name
        if not self.started and self.starton == name:
            self.started = True
        if self.started:
            # run the code
            print("Running {0} ...".format(name))
            return True
        else:
            # don't run the code
            print("(skip {0})".format(name))
            return False

    @contextmanager
    def do(self):
        try:
            yield
        except:
            print("Resume with --resume {0}".format(pipes.quote(self.current)))
            raise

@click.command()
@click.option('--resume', help="Step to resume on")
@click.option('--skip-mac', is_flag=True)
@click.option('--skip-linux', is_flag=True)
@click.option('--skip-win', is_flag=True)
def doit(skip_mac, skip_linux, skip_win, resume):
    step = StepTracker(starton=resume)
    with step.do():

        if step("dirty check"):
            stdout = subprocess.check_output(['git', 'status', '--short']).strip()
            if stdout:
                print(stdout)
                raise Exception("Uncommitted changes")

        if step("translations"):
            if yesno('Export translations?', default=True):
                subprocess.check_call(['dev/update_translations.sh'])
                subprocess.check_call(['dev/export_translations.sh'])
                try:
                    subprocess.check_call(['git', 'add', 'src/langs'])
                    subprocess.check_call(['git', 'commit', '-m', 'Update translation strings'])
                except:
                    # nothing to commit
                    pass

        if step("run tests"):
            if yesno('Run tests?', default=True):
                subprocess.check_call(['yarn', 'test'], cwd='.')
                subprocess.check_call(['yarn', 'test'], cwd='../core')
        
        if step("confirm changelog"):
            print('=== CHANGELOG ===')
            new_changelog = subprocess.check_output(['dev/changelog/combine_changes.sh'])
            print(new_changelog)
            if not yesno('Does this look correct?', default=True):
                abort()

        if step("choose version"):
            package_version = getPackageVersion()
            guess_target_version = package_version
            if guess_target_version.count('-'):
                guess_target_version = guess_target_version.split('-')[0]
            latest_version = getLatestReleaseVersion()
            print('package.json version:', package_version)
            print('Latest released version on GitHub:', latest_version)
            target_version = prompt('Version to release?',
                default=guess_target_version)
            updatePackageVersion(target_version)
            print('[X] Updated package.json version to {0}'.format(target_version))

        if step("update changelog"):
            subprocess.check_call(['dev/changelog/updatechangelog.sh'])
            print('[X] Updated CHANGELOG.')

        if step("publish"):
            env = os.environ.copy()
            if skip_win:
                env['SKIP_WIN'] = 'yes'
            if skip_mac:
                env['SKIP_MAC'] = 'yes'
            if skip_linux:
                env['SKIP_LINUX'] = 'yes'
            print('Building and uploading to GitHub...')
            subprocess.check_call(['./publish.sh'], env=env)
            print('[X] Done uploading to GitHub.')

        if step("release notes"):
            subprocess.check_call(['dev/changelog/publishchangelog.py'])

        if step("manual tests"):
            print('Opening the app for testing...')
            subprocess.check_call(['open', 'dist/mac/Buckets.app'], env={})

            if not yesno("Can you submit a bug report? (I'll ask at the end if you received it)"):
                abort()
            if not yesno('Can you create a new budget?'):
                abort()
            if not yesno('Can you open your own budget?'):
                abort()
            if not yesno('Can you open the application on Windows?'):
                abort()
            if not yesno('Did you receive the bug report?'):
                abort()

        if step("publish release notes"):
            print('Go to https://github.com/buckets/application/releases to publish the draft')
            webbrowser.open('https://github.com/buckets/application/releases')
            if not yesno('Have you clicked the Publish button on GitHub?'):
                abort()

        if step("git tag"):
            release_version = getPackageVersion()
            if not yesno('Do git commit and tag?', default=True):
                abort()
            subprocess.check_call(['git', 'commit', '-a', '-m', 'Published v{0}'.format(release_version)])
            subprocess.check_call(['git', 'tag', 'v{0}'.format(release_version)])

        if step("bump to dev"):
            # prepare for next version
            release_version = getPackageVersion()
            parts = map(int, release_version.split('.'))
            next_version = '.'.join(map(str, [parts[0], parts[1]+1, 0])) + '-dev'
            next_version = prompt('Next version?',
                default=next_version)
            updatePackageVersion(next_version)
            subprocess.check_call(['git', 'commit', '-a', '-m', 'Start v{0}'.format(next_version)])
            print('Updated version to {0}'.format(next_version))

        if step("close issues"):
            # close cards
            release_version = getTopChangelogVersion()
            issue_numbers = extractIssueNumbers(getTopChangelog())
            if issue_numbers:
                if yesno('Close GitHub issues? ({0})?'.format(','.join(issue_numbers)), default=True):
                    for issue_number in issue_numbers:
                        github.commentOnIssue(issue_number, 'Included in v{0} release (AUTOMATED COMMENT)'.format(release_version))
                        github.closeIssue(issue_number)

        if step("publish CHANGELOG.md"):
            release_version = getTopChangelogVersion()
            github_dir = os.path.abspath('../../buckets-application')
            subprocess.check_call(['git', 'fetch', 'origin'], cwd=github_dir)
            subprocess.check_call(['git', 'merge', 'origin/master'], cwd=github_dir)
            subprocess.check_call(['cp', 'CHANGELOG.md', github_dir])
            subprocess.check_call(['git', 'add', 'CHANGELOG.md'], cwd=github_dir)
            subprocess.check_call(['git', 'commit', '-m', 'Updated CHANGELOG.md for v{0}'.format(release_version)], cwd=github_dir)
            subprocess.check_call(['git', 'push', 'origin', 'master'], cwd=github_dir)

        if step("push to origin"):
            print('Pushing to origin')
            subprocess.check_call(['git', 'push', 'origin', 'master', '--tags'])

        if step("publish static site"):
            if yesno('Publish main static site? (to update the version, mostly)', default=True):
                subprocess.check_call(['python', 'build.py'], cwd='../staticweb')
                subprocess.check_call(['git', 'add', '_site'], cwd='../staticweb')
                do_push = False
                try:
                    subprocess.check_call(['git', 'commit', '-m', 'Update static site'], cwd='../staticweb')
                    do_push = True
                except:
                    pass
                if do_push:
                    subprocess.check_call(['bash', 'deploy2github.sh'], cwd='../staticweb')


if __name__ == '__main__':
    doit()
