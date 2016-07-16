from flask import Blueprint

blue = Blueprint('frame', __name__)


@blue.route('/')
def index():
    return 'frame index'

@blue.route('/hello')
def hello():
    return 'frame hello'

