net use x: \\vboxsvr\project
wmic logicaldisk get name
X:
echo "on X:"
msiexec /qn /passive /i X:\dev\win\tmp\node.msi
echo "Installed node"
msiexec /qn /passive /i X:\dev\win\tmp\yarn.msi
echo "Installed yarn"
npm install --global --production windows-build-tools
echo "Installed windows-build-tools"
npm config get python
