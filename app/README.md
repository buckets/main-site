# Buckets App

To install deps:

    yarn
    electron-rebuild

To compile:

    tsc
    tsc --watch


To run:

    tsc && yarn start


# Internationalization

1. Use `sss()` from `i18n.ts` package
2. Extract messages from the code with `dev/extract_translations.sh`
3. Update each language file with XXX.TODO
4. Send to GitHub for translation with `dev/export_translations.sh`
5. Get from GitHub with `dev/import_translations.sh`

# Releasing a new version

You should add change snippets to `changes/{fix,break,new,feature,refactor,info,doc}-description.md` as you work then you can do the following:

1. Preview changes with `dev/changelog/combine_changes.sh`
2. Update the version in `package.json`
3. Run `dev/changelog/updatechangelog.sh`
4. Publish with `./publish.sh`
5. Copy up the new `CHANGELOG.md` with `dev/changelog/publishchangelog.py`
6. Manually release on the GitHub website.

