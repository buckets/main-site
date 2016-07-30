import pytest
import os

from sqlalchemy import create_engine
from buckets.schema import upgrade_schema



def pytest_addoption(parser):
    parser.addoption('--count', default=int(os.environ.get('REPEAT', '1')), type='int', metavar='count', help='Run each test the specified number of times')

def pytest_generate_tests(metafunc):
    if metafunc.config.option.count is not None:
        count = int(metafunc.config.option.count)
        metafunc.fixturenames.append('tmp_ct')
        metafunc.parametrize('tmp_ct', range(count))


@pytest.fixture(scope='session')
def engine():
    test_database_url = os.environ.get('TEST_DATABASE_URL')
    if not test_database_url:
        pytest.skip('No TEST_DATABASE_URL provided')

    engine = create_engine(test_database_url,
        connect_args={"application_name": "tests"})
    upgrade_schema(engine)
    return engine
