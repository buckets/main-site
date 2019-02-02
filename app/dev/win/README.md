- `winvm.sh` is the script you use to do everything.  It creates the Windows builder VM using the other files in this repo.

- `winbuild.ts` and `winbuild.js` is a JavaScript script that does all the application build steps.  It also handles some parts of the VM installation.  Node is used because running commands with lots of output through VirtualBox Guest Additions doesn't always work.

XXX it would be a fun exercise to create a Nim program that does all/most of the VM setup.

- `win_build_launcher.bat` is the batch file that launches `winbuild.ts`.  It sets up a shared dir first then executes `winbuild.js`

- `win_installnode.bat` installs node.

