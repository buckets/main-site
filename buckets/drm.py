#!/usr/bin/env python
from __future__ import print_function
from jose import jwt
import os

def createLicense(email, private_key):
    """
    Create an application license
    """
    return jwt.encode({
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
