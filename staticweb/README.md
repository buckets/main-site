To push a new version out:

    python build.py
    ./deploy2github.sh


## I18N and L10N

1. Extract

    dev/dolangs.sh extract

2. Translate the stuff in `./translations/`

3. Compile
    
    dev/dolangs.sh compile

4. Re-render

    python build.py


Add a new language:

    dev/dolangs.sh new es
