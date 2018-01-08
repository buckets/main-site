# Dev server

To run the server:

    docker-compose up --build

Then go to:

    http://${DOCKER_IP}

# I18N and L10N

1. Extract
    
    dev/dolangs.sh extract

2. Then translate the stuff in `buckets/web/translations/`

3. Compile

    dev/dolangs.sh compile

Add a new language:

    dev/dolangs.sh new es


# Deploy

./deploy2heroku.sh
