#!/bin/sh

cmd=$1

case "$cmd" in
    extract)
        pybabel extract -F babel.cfg --no-wrap -o messages.pot .
        pybabel update -i messages.pot -d translations
        ;;
    compile)
        pybabel compile -d translations
        ;;
    new)
        THELOCALE=$2
        if [ -z "$THELOCALE" ]; then
            echo "Error: need a locale as second arg"
            exit 1
        fi
        pybabel init -i messages.pot -d translations -l "$THELOCALE"
        ;;
    *)
        echo "commands:"
        echo "  extract"
        echo "  compile"
        echo "  new LANG"
        exit 1
esac
