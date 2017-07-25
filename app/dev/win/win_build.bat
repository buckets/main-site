echo "win_build.bat start"
c:
cd \
md cache
copy x:\package.json c:\cache\
copy x:\yarn.lock c:\cache\
cd \cache
set NODE_PATH=c:\cache\node_modules
set PYTHON=C:\Users\IEUser\.windows-build-tools\python27\python.exe
set PATH=%PATH%;C:\Users\IEUser\.windows-build-tools\python27
set
yarn --no-emoji --no-progress --silent
type yarnlog.log

x:
yarn compile
c:\cache\node_modules\.bin\build --win
