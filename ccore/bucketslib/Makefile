.PHONY: clean compile

build/Release/bucketslib.node: compile csrc/nimbase.h
	node-gyp rebuild

compile:
	nim cpp --noMain -d:release --header --compileOnly --nimcache:csrc ../bucketslibnode.nim

csrc/nimbase.h: ~/lib/Nim/lib/nimbase.h
	cp $^ $@

clean:
	-rm -r csrc
	-rm -r build
