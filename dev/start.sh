#!/bin/sh

docker-compose up -d postgres
export DATABASE_URL="postgres://postgres:postgres@$(docker-machine ip $(docker-machine active)):5432/postgres"
python runweb.py
