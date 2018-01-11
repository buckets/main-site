#!/usr/bin/env python
import io
import requests
import sys
import re
import json
import os
import glob

GH_TOKEN = os.environ['GH_TOKEN']
GH_USER = os.environ.get('GH_USERNAME', 'iffy')

r_issuenum = re.compile(r'#([0-9]+)')

filenames = sys.argv[1:]
if not filenames:
    pattern = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../changes/') + '*.md')
    print('pattern', pattern)
    filenames = glob.glob(pattern)

for filename in filenames:
    print(filename)
    with io.open(filename, 'rb') as fh:
        nums = r_issuenum.findall(fh.read())
        for num in nums:
            r = requests.post('https://api.github.com/repos/buckets/application/issues/{0}/labels'.format(num),
                data=json.dumps(['included in next release']),
                auth=(GH_USER, GH_TOKEN))
            if not r.ok:
                raise Exception('Error labelling issue {0}: {1}'.format(num, r.text))
