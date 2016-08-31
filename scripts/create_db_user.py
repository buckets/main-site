#!/usr/bin/env python

import argparse
import os
import time

from humancrypto import y2016

from urlparse import urlparse
from hashlib import md5

from sqlalchemy import create_engine


ap = argparse.ArgumentParser()
ap.add_argument('-D', '--database',
    default=os.environ.get('DATABASE_URL'),
    help='Database URL.  (env: DATABASE_URL)')
ap.add_argument('-U', '--username',
    default='web',
    help='Username to create.  Default: %(default)s')
ap.add_argument('-r', '--role',
    default='web_r',
    help='Role to put in.  Default: %(default)s')
ap.add_argument('-p', '--password',
    default=None,
    help='Password.  FOR DEV ONLY')

args = ap.parse_args()
if not args.database:
    raise Exception("You must provide a database")
if not args.username:
    raise Exception('You must provide a username')
if not args.role:
    raise Exception('You must provide a role')

engine = create_engine(args.database)
while True:
    try:
        engine.connect().close()
        break
    except:
        time.sleep(0.5)

if not args.password:
    password = y2016.random_urlsafe_token()
else:
    password = args.password
encrypted_password = 'md5{0}'.format(md5(password + args.username).hexdigest())

try:
    engine.execute('CREATE ROLE {0} LOGIN IN ROLE {1}'.format(
        args.username, args.role))
except Exception:
    pass

engine.execute('ALTER ROLE {0} ENCRYPTED PASSWORD %s'.format(args.username),
        (encrypted_password,))

parsed = urlparse(args.database)
netloc = parsed.netloc

creds = ''
hostpart = netloc
if '@' in netloc:
    creds, hostpart = netloc.split('@', 1)

u = creds
p = ''
if ':' in creds:
    u, p = creds.split(':', 1)
u = args.username

h = hostpart
port = ''
if ':' in hostpart:
    h, port = hostpart.split(':', 1)

p = password

netloc = ''
if u:
    netloc += u
if p:
    netloc += ':{0}'.format(p)
if netloc:
    netloc = '{0}@{1}'.format(netloc, h)
if port:
    netloc += ':{0}'.format(port)

database_url = parsed._replace(netloc=netloc)
print database_url.geturl()
