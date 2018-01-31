#!/usr/bin/env python
from __future__ import print_function
import io
import sys
import re
import os
import glob
from trello import TrelloData

trello = TrelloData()

r_cardid = re.compile(r'#([a-zA-Z0-9]+)')

filenames = sys.argv[1:]
if not filenames:
    pattern = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../changes/') + '*.md')
    filenames = glob.glob(pattern)

for filename in filenames:
    print(filename)
    with io.open(filename, 'rb') as fh:
        card_ids = r_cardid.findall(fh.read())
        for card_id in card_ids:
            print(' ', card_id)
            trello.labelCard(card_id, ['Included in next release'])

