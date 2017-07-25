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
call npm install -g node-gyp && call yarn && echo done

x:
call yarn compile
c:\cache\node_modules\.bin\build --win
