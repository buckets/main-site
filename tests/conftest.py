import pytest
import os

from sqlalchemy import create_engine
from buckets.schema import upgrade_schema


@pytest.fixture(scope='session')
def engine():
    test_database_url = os.environ.get('TEST_DATABASE_URL')
    if not test_database_url:
        pytest.skip('No TEST_DATABASE_URL provided')

    engine = create_engine(test_database_url,
        connect_args={"application_name": "tests"})
    upgrade_schema(engine)
    return engine
