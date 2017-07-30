echo "win_build.bat start"
c:
cd \
md app
md app\dist
net use x: \\vboxsvr\project
xcopy x:\ c:\app /s /Y /EXCLUDE:C:\builder\copyexclude.txt
cd \app
set PYTHON=C:\Users\IEUser\.windows-build-tools\python27\python.exe
set PATH=%PATH%;C:\Users\IEUser\.windows-build-tools\python27
set
cmd /c npm install -g node-gyp
cmd /c yarn --non-interactive --ignore-scripts
cmd /c yarn compile
IF "%1"=="publish" (
    cmd /c c:\app\node_modules\.bin\build --win -p always >c:\app\dist\build.log
) ELSE (
    IF "%1"=="dev" (
        cmd /c yarn start
    ) ELSE (
        cmd /c c:\app\node_modules\.bin\build --win >c:\app\dist\build.log
    )
)

rem xcopy c:\app\dist x:\dist /s /Y 
