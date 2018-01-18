import structlog
logger = structlog.get_logger()

from flask import Blueprint, request, jsonify
from flask import current_app

blue = Blueprint('api', __name__)


#----------------------------------------------------
# application
#----------------------------------------------------
@blue.route('/bugreport', methods=['POST'])
def bugreport():
    try:
        json_data = request.get_json()
        from_email = json_data['from_email']
        body = json_data['body']
        bugid = json_data['bugid']
        attachments = json_data.get('attachments', None)
    except Exception as e:
        return jsonify(error='Error parsing input.'), 400
    try:
        current_app.mailer.send('bugs@budgetwithbuckets.com',
            ('Buckets Bug Reporter', 'hello@budgetwithbuckets.com'),
            subject='Buckets Bug {0} - {1}'.format(bugid, from_email),
            body=body,
            reply_to=from_email,
            attachments=attachments)
    except Exception as e:
        logger.error('Error submitting bug report', exc_info=e)
        return jsonify(error='Error submitting bug report.'), 500
    return jsonify(result='ok')
