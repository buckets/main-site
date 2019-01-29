NIMFILES = ../ccore/src/buckets/clib.nim
NIMBASE = ~/lib/Nim/lib/nimbase.h
RELEASE_TYPE = debug
COMMON_BUILD_FLAGS = --header --nimcache:csrc --compileOnly --gc:markAndSweep

.PHONY: clean release debug test all

all: dist/main.js lib/bucketslib.node

dist/main.js: jssrc/main.ts
	tsc

dist/test.js: jssrc/test.ts

lib/bucketslib.node: csrc/nimbase.h $(RELEASE_TYPE)
	node-gyp rebuild

release: $(NIMFILES)
	nim cpp -d:release $(COMMON_BUILD_FLAGS) $^

debug: $(NIMFILES)
	nim cpp --checks:on  -d:useSysAssert -d:useGcAssert $(COMMON_BUILD_FLAGS) $^

csrc/nimbase.h: $(NIMBASE)
	mkdir -p csrc
	cp $^ $@

test: dist/test.js
	node dist/test.js

clean:
	-rm -r csrc
	-rm -r build
	-rm -r lib
	-rm -r dist
