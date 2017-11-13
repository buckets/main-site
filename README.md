To run the server:

    docker-compose up --build

Then go to:

    http://${DOCKER_IP}

See app/README.md for everything else

# I18N and L10N

1. Extract
    
    dev/dolangs.sh extract

2. Then translate the stuff in `translations/`

3. Compile

    dev/dolangs.sh compile

Add a new language:

    dev/dolangs.sh new es

