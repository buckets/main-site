echo "win_build.bat start"
c:
cd \
md proj
md proj\dist
rem net use y: \\vboxsvr\project
rmdir c:\proj\app\src /s /q
rmdir c:\proj\app\migrations /s /q
type C:\builder\copyexclude.txt
xcopy y:\ c:\proj /d /F /I /s /Y /EXCLUDE:C:\builder\copyexclude.txt
if %errorlevel% neq 0 exit /b %errorlevel%

set PYTHON=C:\Users\IEUser\.windows-build-tools\python27\python.exe
set PATH=%PATH%;C:\Users\IEUser\.windows-build-tools\python27
set
cmd /c npm install -g node-gyp
if %errorlevel% neq 0 exit /b %errorlevel%

cmd /c yarn config set yarn-offline-mirror c:\proj\yarnmirror
cmd /c yarn config set yarn-offline-mirror-pruning false

cd \proj\core
del /S node_modules
cmd /c yarn --non-interactive --ignore-scripts
if %errorlevel% neq 0 exit /b %errorlevel%
cmd /c yarn compile
if %errorlevel% neq 0 exit /b %errorlevel%

cd \proj\app
del /S node_modules
cmd /c yarn --non-interactive --ignore-scripts
if %errorlevel% neq 0 exit /b %errorlevel%
cmd /c yarn compile
if %errorlevel% neq 0 exit /b %errorlevel%

IF "%1"=="publish" (
    cmd /c c:\proj\app\node_modules\.bin\build --win --x64 --ia32 -p always >c:\proj\app\dist\build.log
) ELSE (
    IF "%1"=="dev" (
        cmd /c yarn start
    ) ELSE (
        cmd /c c:\proj\app\node_modules\.bin\build --win --x64 --ia32 >c:\proj\app\dist\build.log
    )
)

xcopy c:\proj\app\dist\. y:\dist /d /F /I /s /Y 
