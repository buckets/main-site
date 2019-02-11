.PHONY: clean

setupwin.exe: setupwin.nim tmp/mingw32.zip tmp/Git32.exe tmp/dlls.zip
	nim c -d:mingw --cpu:amd64 -o:$@ setupwin.nim

tmp/mingw32.zip:
	[ -f tmp/mingw32.7z ] || curl -o tmp/mingw32.7z "https://nim-lang.org/download/mingw32-6.3.0.7z"
	cd tmp && 7z x mingw32.7z
	cd tmp && zip -r mingw32.zip mingw32
	cd tmp && rm mingw32.7z
	cd tmp && rm -rf mingw32

tmp/Git32.exe:
	curl -L -o $@ "https://github.com/git-for-windows/git/releases/download/v2.20.1.windows.1/Git-2.20.1-32-bit.exe"

tmp/dlls.zip:
	curl -L -o $@ "https://nim-lang.org/download/dlls.zip"

clean:
	-rm tmp/mingw32.zip
	-rm tmp/Git32.exe
	-rm setupwin.exe
