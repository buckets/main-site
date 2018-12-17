.PHONY: clean compile

build/Release/bucketslib.node: compile csrc/sqlite3.h csrc/sqlite3.c csrc/nimbase.h
	node-gyp rebuild

compile:
	nim cpp -d:release --header --nimcache:csrc --dynlibOverride:sqlite3 --compileOnly ../src/buckets.nim

csrc/nimbase.h: ~/lib/Nim/lib/nimbase.h
	mkdir -p csrc
	cp $^ $@

csrc/sqlite3.h: ../src/buckets/sqlite3/sqlite3.h
	mkdir -p csrc
	cp $^ $@

csrc/sqlite3.c: ../src/buckets/sqlite3/sqlite3.c
	mkdir -p csrc
	cp $^ $@

clean:
	-rm -r csrc
	-rm -r build
	-rm -r lib
