#!/usr/bin/env python
import io
import sys
import re
import os
import glob
import time
from github import GitHubClient

GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')
github = GitHubClient(GH_USER, GH_TOKEN, 'buckets', 'application')

r_issuenum = re.compile(r'#([0-9]+)')

filenames = sys.argv[1:]
if not filenames:
    pattern = os.path.abspath(os.path.join(os.path.dirname(__file__), '../changes/') + '*.md')
    filenames = glob.glob(pattern)

for filename in filenames:
    sys.stdout.write(os.path.basename(filename))
    sys.stdout.flush()
    with io.open(filename, 'rb') as fh:
        nums = r_issuenum.findall(fh.read())
        for num in nums:
            github.labelIssue(num, ['included in next release'])
            sys.stdout.write(' #{0}'.format(num))
            time.sleep(1.1)
    sys.stdout.write('\n')