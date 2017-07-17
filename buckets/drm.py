#!/usr/bin/env python
from __future__ import print_function
from jose import jwt
import os

def createLicense(name, email, private_key):
    """
    Create an application license
    """
    return jwt.encode({
        'name': name,
        'email': email,
    }, private_key, algorithm='RS256')


if __name__ == '__main__':
    priv_key = os.environ['BUCKETS_LICENSE_KEY']
    print(priv_key)
    name = raw_input('name? ')
    email = raw_input('email? ')
    license = createLicense(name, email, priv_key)
    print(license)
