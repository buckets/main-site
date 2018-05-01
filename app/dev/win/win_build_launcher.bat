echo "win_build_launcher.bat"
net use y: \\vboxsvr\project
dir y:\
xcopy y:\app\dev\win\. c:\builder /s /f /Y
type c:\builder\win_build.bat
c:\builder\win_build.bat %1
