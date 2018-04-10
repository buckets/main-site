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
set ELECTRON_BUILDER_CACHE=Y:\cache\electron-cache
set ELECTRON_CACHE=Y:\cache\electron-cache
set
cmd /c npm config set msvs_version 2015 --global
cmd /c npm install -g node-gyp
if %errorlevel% neq 0 exit /b %errorlevel%

cmd /c yarn config set yarn-offline-mirror y:\cache\yarnmirror
cmd /c yarn config set yarn-offline-mirror-pruning false

cd \proj\core
rem del /S /Q node_modules
cmd /c yarn --non-interactive --ignore-scripts
if %errorlevel% neq 0 exit /b %errorlevel%
cmd /c yarn compile
if %errorlevel% neq 0 exit /b %errorlevel%

cd \proj\app
rem del /S /Q node_modules
cmd /c yarn --non-interactive --ignore-scripts
if %errorlevel% neq 0 exit /b %errorlevel%
cmd /c yarn compile
if %errorlevel% neq 0 exit /b %errorlevel%

IF "%1"=="publish" (
    cmd /c c:\proj\app\node_modules\.bin\build --win --x64 --ia32 -p always >c:\proj\app\dist\build.log
    if %errorlevel% neq 0 exit /b %errorlevel%
) ELSE (
    IF "%1"=="dev" (
        cmd /c yarn start
        if %errorlevel% neq 0 exit /b %errorlevel%
    ) ELSE (
        rem cmd /c c:\proj\app\node_modules\.bin\build --win --x64 --ia32       
        cmd /c c:\proj\app\node_modules\.bin\build --win --x64 --ia32 >c:\proj\app\dist\build.log
    )
)
type c:\proj\app\dist\build.log
if %errorlevel% neq 0 exit /b %errorlevel%

xcopy c:\proj\app\dist\. y:\app\dist /d /F /I /s /Y 
