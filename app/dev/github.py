import requests
import json


class GitHubClient(object):

    def __init__(self, username, token, org, repo):
        self._username = username
        self._token = token
        self.org = org
        self.repo = repo
        self.session = requests.Session()
        self.session.auth = (username, token)

    def url(self, path):
        return ''.join(['https://api.github.com/repos/{org}/{repo}'.format(
            org=self.org,
            repo=self.repo,
        ), path])

    def getLatestReleaseVersion(self):
        r = self.session.get(self.url('/releases'))
        releases = r.json()
        for release in releases:
            if release['draft']:
                continue
            return release['name']

    def labelIssue(self, issue_number, labels):
        if type(labels) != list:
            labels = [labels]
        r = self.session.post(self.url('/issues/{0}/labels'.format(issue_number)),
            data=json.dumps(labels))
        if not r.ok:
            raise Exception('Error adding labels to issue {0}: {1}'.format(issue_number, r.text))

    def createIssue(self, title, description, milestone=None, labels=None):
        data = {
            "title": title,
            "body": description,
        }
        if milestone:
            data['milestone'] = milestone
        if labels:
            data['labels'] = labels
        r = self.session.post(self.url('/issues'),
            data=json.dumps(data))
        if not r.ok:
            raise Exception('Error creating issue {0}: {1}'.format(title, r.text))
        return r.json()

    def commentOnIssue(self, issue_number, comment):
        r = self.session.post(self.url('/issues/{0}/comments'.format(issue_number)),
            data=json.dumps({
                'body': comment,
            }))
        if not r.ok:
            raise Exception('Error commenting on issue {0}: {1}'.format(issue_number, r.text))

    def closeIssue(self, issue_number):
        r = self.session.patch(self.url('/issues/{0}'.format(issue_number)),
            data=json.dumps({
                'state': 'closed',
            }))
        if not r.ok:
            raise Exception('Error closing issue {0}: {1}'.format(issue_number, r.text))


if __name__ == '__main__':
    import os
    test_issue = 13
    GH_TOKEN = os.environ['GH_TOKEN']
    GH_USER = os.environ.get('GH_USERNAME', 'iffy')
    client = GitHubClient(GH_USER, GH_TOKEN, 'buckets', 'application')
    print client.getLatestReleaseVersion()
    client.commentOnIssue(test_issue, 'test comment')
    client.labelIssue(test_issue, 'included in next release')