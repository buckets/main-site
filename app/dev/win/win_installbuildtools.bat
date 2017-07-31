call npm install --global --production windows-build-tools >NUL
md C:\Users\IEUser\.windows-build-tools
xcopy C:\Users\Administrator\.windows-build-tools C:\Users\IEUser\.windows-build-tools /s /f >NUL
