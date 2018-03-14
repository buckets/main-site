echo "win_build.bat start"
c:
cd \
md app
md app\dist
net use y: \\vboxsvr\project
rmdir c:\app\src /s /q
rmdir c:\app\migrations /s /q
xcopy y:\ c:\app /F /I /s /Y /EXCLUDE:C:\builder\copyexclude.txt
cd \app
set PYTHON=C:\Users\IEUser\.windows-build-tools\python27\python.exe
set PATH=%PATH%;C:\Users\IEUser\.windows-build-tools\python27
set
cmd /c npm install -g node-gyp
cmd /c yarn --non-interactive --ignore-scripts
cmd /c yarn compile
IF "%1"=="publish" (
    cmd /c c:\app\node_modules\.bin\build --win --x64 --ia32 -p always >c:\app\dist\build.log
) ELSE (
    IF "%1"=="dev" (
        cmd /c yarn start
    ) ELSE (
        cmd /c c:\app\node_modules\.bin\build --win --x64 --ia32 >c:\app\dist\build.log
    )
)

xcopy c:\app\dist y:\dist /F /I /s /Y 
