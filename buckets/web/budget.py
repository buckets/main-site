from flask import Blueprint, g

blue = Blueprint('budget', __name__, url_prefix='/farm/<int:farm_id>')

# @bp.url_defaults
# def add_language_code(endpoint, values):
#     values.setdefault('lang_code', g.lang_code)

@blue.url_value_preprocessor
def pull_farm_id(endpoint, values):
    g.farm_id = values.pop('farm_id')


@blue.route('/')
def index():
    return 'budget index: {0}'.format(g.farm_id)
