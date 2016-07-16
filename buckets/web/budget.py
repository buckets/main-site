from flask import Blueprint, render_template

blue = Blueprint('budget', __name__)


@blue.route('/')
def index():
    return render_template('app/index.html')
