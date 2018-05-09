echo "win_build_launcher.bat"
net use y: \\vboxsvr\project
dir y:\
xcopy y:\app\dev\win\. c:\builder /s /f /Y
cmd /c node c:\builder\winbuild.js build "%1"

