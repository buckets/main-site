echo "win_build.bat start"
c:
cd \
md cache
copy x:\package.json c:\cache\
copy x:\yarn.lock c:\cache\
cd \cache
set NODE_PATH=c:\cache\node_modules
setx NODE_PATH c:\cache\node_modules
set PYTHON=C:\Users\IEUser\.windows-build-tools\python27\python.exe
setx PYTHON C:\Users\IEUser\.windows-build-tools\python27\python.exe
set PATH=%PATH%;C:\Users\IEUser\.windows-build-tools\python27
setx PATH "%PATH%;C:\Users\IEUser\.windows-build-tools\python27"
set
cmd /c npm install -g node-gyp
cmd /c yarn --non-interactive --ignore-scripts

x:
cmd /c yarn compile
c:\cache\node_modules\.bin\build --win
