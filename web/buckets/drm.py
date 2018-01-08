#!/usr/bin/env python
from __future__ import print_function
from jose import jwt
import os
import time

def createLicense(email, private_key):
    """
    Create an application license
    """
    prefix = '-----BEGIN RSA PRIVATE KEY-----'
    suffix = '-----END RSA PRIVATE KEY-----'
    private_key = private_key.replace(prefix, '')
    private_key = private_key.replace(suffix, '')
    private_key = private_key.strip().replace(' ', '\n')
    private_key = '{prefix}\n{private_key}\n{suffix}'.format(**locals())
    return jwt.encode({
        'iat': int(time.time()),
        'email': email,
    }, private_key, algorithm='RS256')


def chunk(thing, length):
    return [thing[0+i:length+i] for i in range(0, len(thing)+1, length)]

def formatLicense(text):
    chunks = chunk(text, 10)
    rows = chunk(chunks, 4)
    formatted = '\n'.join([' '.join(row) for row in rows])
    return ('------------- START LICENSE ---------------\n'
            '{0}\n'
            '------------- END LICENSE -----------------').format(formatted)


if __name__ == '__main__':
    priv_key = os.environ['BUCKETS_LICENSE_KEY']
    email = raw_input('email? ')
    license = createLicense(email, priv_key)
    print(formatLicense(license))
