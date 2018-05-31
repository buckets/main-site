# Buckets App

To install deps:

    yarn
    electron-rebuild

To compile:

    tsc
    tsc --watch


To run:

    tsc && yarn start


# Refreshing buckets-core

    yarn add file:../core


# Internationalization

To add a new language do:

    cp src/langs/en.tsx src/langs/${LANG}.tsx

To add the language as an option in the preferences dropdown do:

- Add it as an option in `preferences.tsx`

Other use:

1. Use `sss()` from `i18n.ts` package
2. Extract and update each language file with `dev/update_translations.sh`
3. Get stats with `dev/transstats.sh`
4. Send to GitHub for translation with `dev/export_translations.sh`
5. Get from GitHub with `dev/import_translations.sh`


# Releasing a new version

Add change snippets to `changes/{fix,break,new,feature,refactor,info,doc}-description.md` as you work then you can do the following:

Do all this with:

    python mkrelease.py
