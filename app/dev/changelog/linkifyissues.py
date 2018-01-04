#!/usr/bin/env python
import sys
import re
r_issuenum = re.compile(r'(#[0-9]+)')
issue_text = sys.stdin.read()
issues = r_issuenum.split(issue_text)
results = []
for chunk in issues:
    m = r_issuenum.match(chunk)
    if m:
        num = chunk[1:]
        results.append('[{chunk}](https://github.com/buckets/application/issues/{num})'.format(**locals()))
    else:
        results.append(chunk)
print ''.join(results)
