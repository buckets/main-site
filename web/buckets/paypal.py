import requests


class PayPal(object):

    def __init__(self, access_token, sandbox=True, web_root='https://www.budgetwithbuckets.com'):
        self.api_root = 'https://api.sandbox.paypal.com'
        if not sandbox:
            self.api_root = 'https://api.paypal.com'
        self.web_root = web_root
        self.access_token = access_token

    def createPayment(self, amount):
        r = requests.post(self.api_root + '/v1/payments/payment',
            headers={
                'Authorization': 'Bearer {0}'.format(self.access_token),
            },
            json={
                'intent': 'sale',
                'redirect_urls': {
                    'return_url': self.web_root + '/paypal-success',
                    'cancel_url': self.web_root + '/buy',
                },
                'transactions': [
                    {
                        'amount': {
                            'total': amount,
                            'currency': 'USD',
                        }
                    }
                ]
            })
        data = r.json()
        if data['state'] != 'created':
            raise Exception('Error making payment request')
        return data['id']

    def executePayment(self):
        pass