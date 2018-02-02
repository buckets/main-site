import os
import requests

TRELLO_KEY = os.environ['TRELLO_KEY']
TRELLO_TOKEN = os.environ['TRELLO_TOKEN']

BUCKETS_BOARD = '0VAYcWff'

class TrelloData(object):

    def __init__(self, board_id=BUCKETS_BOARD):
        self.board_id = board_id


    def req(self, method, path, data=None):
        data = data or {}
        data.update({
            'key': TRELLO_KEY,
            'token': TRELLO_TOKEN,
        })
        r = requests.request(method, 'https://api.trello.com/1{0}'.format(path),
            params=data)
        return r

    _labels = None
    @property
    def labels(self):
        if self._labels is None:
            r = self.req('GET', '/boards/{0}/labels'.format(self.board_id))
            self._labels = r.json()
        return self._labels

    def labelIdFor(self, name):
        for label in self.labels:
            if label['name'].lower() == name.lower():
                return label['id']

    _lists = None
    @property
    def lists(self):
        if self._lists is None:
            r = self.req('GET', '/boards/{0}/lists'.format(self.board_id))
            self._lists = r.json()
        return self._lists

    def listIdFor(self, name):
        for l in self.lists:
            if l['name'].lower() == name.lower():
                return l['id']

    def labelCard(self, card_id, labels):
        for label in labels:
            label_id = self.labelIdFor(label)
            r = self.req('POST', '/cards/{card_id}/idLabels'.format(**locals()), {
                'value': label_id,
            })
            if not r.ok:
                print('Error adding label {0} to card {1}: {2}'.format(
                    label, card_id, r.text))


    def commentOnCard(self, card_id, comment):
        r = self.req('POST', '/cards/{card_id}/actions/comments'.format(**locals()),
            {
                'text': comment,
            })
        if not r.ok:
            raise Exception('Error commenting on card {0}: {1}'.format(card_id, r.text))

    def moveCardToList(self, card_id, list_name):
        list_id = self.listIdFor(list_name)
        r = self.req('/cards/{card_id}'.format(**locals()),
            {
                'idList': list_id,
            })
        if not r.ok:
            raise Exception('Error moving card {0} to list {1}: {2}'.format(
                card_id, list_id, r.text))
