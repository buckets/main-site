import json
import requests

import structlog
logger = structlog.get_logger()


class PostmarkMailer(object):

    api_root = 'https://api.postmarkapp.com'

    def __init__(self, api_key):
        self.api_key = api_key

    def send(self, to_email, (from_name, from_email), subject, body=None, html=None):
        if type(to_email) not in (tuple, list):
            to_email = [to_email]
        data = {
            'To': ','.join(to_email),
            'From': from_email,
            'Subject': subject,
        }
        if body:
            data['TextBody'] = body
        if html:
            data['HtmlBody'] = html
        return requests.post(
            self.api_root + '/email',
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': self.api_key,
            },
            data=json.dumps(data))

    sendPlain = send

    def sendTemplate(self, template_name, to_email, data):
        """
        Send a Postmark template.
        """
        template_id = self.templateNameToID(template_name)
        if not template_id:
            raise KeyError('No such email template: {0!r}'.format(template_name))
        data = {
            'TemplateId': template_id,
            'TemplateModel': data,
            'To': to_email,
            'From': 'hello@bucketsisbetter.com',
        }
        return requests.post(
            self.api_root + '/email/withTemplate',
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': self.api_key,
            },
            data=json.dumps(data))

    _template_name2id = {}

    def listTemplates(self):
        r = requests.get(self.api_root + '/templates',
            params={'count': 500, 'offset': 0},
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Postmark-Server-Token': self.api_key,
            })
        data = r.json()
        return data['Templates']

    def templateNameToID(self, name):
        if not self._template_name2id:
            templates = self.listTemplates()
            for template in templates:
                if template['Active']:
                    logger.info('Found Postmark template {0}'.format(template['Name']),
                        system='PostmarkMailer')
                    self._template_name2id[template['Name']] = template['TemplateId']
        return self._template_name2id.get(name)


class NoMailer(object):

    def sendPlain(self, to_email, (from_name, from_email), subject, body=None, html=None):
        logger.info('sendPlain', system='NoMailer', to_email=to_email, from_name=from_name, from_email=from_email, subject=subject, body=body, html=html)
        return 'No mail'

    def sendTemplate(self, template_name, to_email, data):
        """
        Pretend to send an email template.
        """
        logger.info('sendTemplate', system='NoMailer', template_name=template_name, to_email=to_email, data=data)
        return 'Pretended to send mail'


class DebugMailer(object):

    def __init__(self):
        self.calls = []

    def sendPlain(self, *args, **kwargs):
        self.calls.append(('sendPlain', args, kwargs))

    def sendTemplate(self, *args, **kwargs):
        self.calls.append(('sendTemplate', args, kwargs))

