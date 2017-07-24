net use x: \\vboxsvr\project
wmic logicaldisk get name
X:
echo "on X:"
msiexec /qn /passive /i X:\tmp\node.msi
msiexec /qn /passive /i X:\tmp\yarn.msi

