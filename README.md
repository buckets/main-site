# Tests

To run all tests:

    tests/all.sh

To run Python tests:

    tox

To run JavaScript tests:

    tests/testjs.sh
    tests/testjs.sh watch


# Deploying to OpenShift

After you push, you'll need to make the `web` database user and set
`DATABASE_URL`.  You can do it like this:

    WEB_DB_URL="$(rhc ssh --command 'cd ${OPENSHIFT_REPO_DIR} && PYTHONPATH=. scripts/create_db_user.py')"
    rhc set-env DATABASE_URL="${WEB_DB_URL}"

