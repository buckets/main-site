from flask import Blueprint

blue = Blueprint('budget', __name__)


@blue.route('/')
def index():
    return 'budget index'
