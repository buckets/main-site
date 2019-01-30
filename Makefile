
CCORE_NIM_FILES = $(shell find ccore/src/ -type f -name '*.nim')

CORE_TS_FILES = $(shell find core/src/ -type f -name '*.ts')
CORE_JS_FILES = $(patsubst core/src/%.ts, core/dist/%.js, $(CORE_TS_FILES))
CORE_NODELIB = core/node_modules/bucketslib/lib/bucketslib.node

NB_NODELIB = nodebuckets/lib/bucketslib.node

APP_NODELIB = app/node_modules/bucketslib/lib/bucketslib.node
APP_TS_FILES = $(shell find app/src/ -type f -name '*.ts')
APP_JS_FILES = $(patsubst app/src/%.ts, app/src/%.js, $(APP_TS_FILES))

.PHONY: all test deepclean clean core core-test app-test ccore-test nb-test

all: $(APP_NODELIB) $(APP_JS_FILES)

test: ccore-test nb-test core-test app-test

clean:
	-cd nodebuckets && $(MAKE) clean
	-cd core && rm -r dist
	-rm -rf core/node_modules/bucketslib 
	-rm -rf app/node_modules/bucketslib

deepclean: clean
	-rm -rf core/node_modules
	-cd core && yarn --ignore-scripts
	-rm -rf app/node_modules
	-cd app && yarn --ignore-scripts
	-rm -rf nodebuckets/node_modules

ccore-test:
	cd ccore && nimble test

$(NB_NODELIB): $(CCORE_NIM_FILES) nodebuckets/Makefile nodebuckets/*.cpp nodebuckets/jssrc/* nodebuckets/binding.gyp nodebuckets/tsconfig.json
	cd nodebuckets && $(MAKE)

nb-test: $(NB_NODELIB)
	cd nodebuckets && $(MAKE) test

$(CORE_NODELIB): $(NB_NODELIB)
	cd core && (rm -r node_modules/bucketslib ; yarn add file:../nodebuckets)

$(CORE_JS_FILES): $(CORE_TS_FILES) $(CORE_NODELIB)
	cd core && tsc

core-test: $(CORE_JS_FILES) $(CORE_NODELIB)
	cd core && yarn test

$(APP_NODELIB): $(CORE_NODELIB) $(CORE_JS_FILES)
	cd app && (rm -r node_modules/bucketslib ; yarn add file:../core)

$(APP_JS_FILES): $(APP_TS_FILES) $(APP_NODELIB)
	cd app && tsc

app-test: $(APP_JS_FILES) $(APP_NODELIB)
	cd app && yarn test
