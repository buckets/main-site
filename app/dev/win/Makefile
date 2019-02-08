
setupwin.exe: setupwin.nim tmp/nim-0.19.2_x32.zip tmp/mingw32-6.3.0.7z
	nim c -d:mingw --cpu:amd64 -o:$@ setupwin.nim

tmp/nim-0.19.2_x64.zip:
	curl -o $@ "https://nim-lang.org/download/nim-0.19.2_x64.zip"

tmp/nim-0.19.2_x32.zip:
	curl -o $@ "https://nim-lang.org/download/nim-0.19.2_x32.zip"

tmp/mingw32-6.3.0.7z:
	curl -o $@ "https://nim-lang.org/download/mingw32-6.3.0.7z"

tmp/mingw64-6.3.0.7z:
	curl -o $@ "https://nim-lang.org/download/mingw64-6.3.0.7z"
