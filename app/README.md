# Buckets App

To install deps:

    yarn
    electron-rebuild

To compile:

    tsc
    tsc --watch


To run:

    tsc && yarn start


# Releasing a new version

You should add change snippets to `changes/{fix,break,new,feature,refactor,info,doc}-description.md` as you work then you can do the following:

1. Preview changes with `dev/changelog/combine_changes.sh`
2. Update the version in `package.json`
3. Run `/dev/changelog/updatechangelog.sh`
4. Publish with `./publish.sh`
5. Copy the the new CHANGELOG.md parts to GitHub and release when ready.

