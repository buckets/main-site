md C:\Users\IEUser\.windows-build-tools
xcopy C:\Users\Administrator\.windows-build-tools C:\Users\IEUser\.windows-build-tools /s /f
setx PYTHON C:\Users\IEUser\.windows-build-tools\python27\python.exe
setx PATH "%PATH%;C:\Users\IEUser\.windows-build-tools\python27"
echo "Done with win_installbuildtools_post.bat"