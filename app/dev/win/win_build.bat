c:
cd \
md cache
copy x:\package.json c:\cache\
copy x:\yank.lock c:\cache\
cd \cache
yarn

x:
c:\cache\node_modules\.bin\build --win
