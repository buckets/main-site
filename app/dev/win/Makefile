
setupwin.exe: setupwin.nim tmp/nim-0.19.2_x64.zip tmp/nim-goodversion.zip
	nim c -d:mingw --cpu:amd64 -o:$@ setupwin.nim

tmp/nim-0.19.2_x64.zip:
	curl -L -o $@ "https://nim-lang.org/download/nim-0.19.2_x64.zip"

tmp/nim-goodversion.zip:
	cd tmp && curl -L https://github.com/nim-lang/Nim/tarball/a58f5b6023744da9f44e6ab8b1c748002b2bbcc0 | tar xz
	mv tmp/nim-lang-Nim-a58f5b6 tmp/nim-goodversion
	cd tmp/nim-goodversion && zip ../nim-goodversion.zip *
	rm -r tmp/nim-goodversion
