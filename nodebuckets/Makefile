NIMFILES = ../ccore/src/buckets/clib.nim
RELEASE_TYPE = debug
NIM_C = cpp
BUILD_FLAGS = --app:staticlib --header --nimcache:csrc --gc:markAndSweep

ifdef OS
	OSNAME = win
	BUILD_FLAGS += -d:mingw --cpu:amd64
	NIM_C = c
	CLIB_NAME = clib/$(OSNAME)/buckets.lib
else
	ifeq ($(shell uname), Linux)
		OSNAME = linux
	else
		OSNAME = mac
	endif
	CLIB_NAME = clib/$(OSNAME)/libbuckets.a
endif

ifeq ($(RELEASE_TYPE), debug)
	BUILD_FLAGS += --checks:on -d:useSysAssert -d:useGcAssert
else
	BUILD_FLAGS += -d:release
endif


.PHONY: clean test all

all: dist/main.js lib/bucketslib.node

node_modules:
	npm i --ignore-scripts

dist/main.js: jssrc/main.ts node_modules
	tsc

dist/test.js: jssrc/test.ts

lib/bucketslib.node: $(CLIB_NAME)
	node-gyp rebuild

$(CLIB_NAME): $(NIMFILES)
	nim $(NIM_C) -o:$(CLIB_NAME) $(BUILD_FLAGS) $^
	-rm csrc/*.o
	-rm csrc/*.cpp
	-rm csrc/*.c

test: dist/test.js
	node dist/test.js

clean:
	-rm -r csrc
	-rm -r clib
	-rm -r build
	-rm -r lib
	-rm -r dist
