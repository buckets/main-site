.PHONY: clean compile

build/Release/bucketslib.node: compile csrc/nimbase.h
	node-gyp rebuild

compile:
	nim c  -d:release --header --nimcache:csrc --dynlibOverride:sqlite3 --compileOnly ../src/buckets.nim

csrc/nimbase.h: ~/lib/Nim/lib/nimbase.h
	mkdir -p csrc
	cp $^ $@

clean:
	-rm -r csrc
	-rm -r build
