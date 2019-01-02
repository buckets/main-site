NIMFILES = $(shell find ../ccore -name '*.nim')
NIMBASE = ~/lib/Nim/lib/nimbase.h


.PHONY: clean compile test all

all: dist/main.js lib/bucketslib.node

dist/main.js: jssrc/main.ts
	tsc

lib/bucketslib.node: csrc/sqlite3.h csrc/sqlite3.c csrc/nimbase.h compile
	node-gyp rebuild

compile: $(NIMFILES)
	nim cpp -d:release --header --nimcache:csrc --dynlibOverride:sqlite3 --compileOnly ../ccore/src/buckets/clib.nim

csrc/nimbase.h: $(NIMBASE)
	mkdir -p csrc
	cp $^ $@

csrc/sqlite3.h: ../ccore/src/buckets/sqlite3/sqlite3.h
	mkdir -p csrc
	cp $^ $@

csrc/sqlite3.c: ../ccore/src/buckets/sqlite3/sqlite3.c
	mkdir -p csrc
	cp $^ $@

test:
	node test.js

clean:
	-rm -r csrc
	-rm -r build
	-rm -r lib
