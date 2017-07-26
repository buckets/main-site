echo "win_publish.bat start"
c:
cd \app
set PYTHON=C:\Users\IEUser\.windows-build-tools\python27\python.exe
setx PYTHON C:\Users\IEUser\.windows-build-tools\python27\python.exe
set PATH=%PATH%;C:\Users\IEUser\.windows-build-tools\python27
setx PATH "%PATH%;C:\Users\IEUser\.windows-build-tools\python27"
set
cmd /c npm install -g node-gyp
cmd /c yarn --non-interactive --ignore-scripts
cmd /c yarn compile
cmd /c c:\app\node_modules\.bin\build --win -p always
xcopy c:\app\dist\ x:\dist /s /Y 
