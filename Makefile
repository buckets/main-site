
CCORE_NIM_FILES = $(shell find ccore/src/ -type f -name '*.nim')

CORE_TS_FILES = $(shell find core/src/ -type f -name '*.ts')
CORE_JS_FILES = $(patsubst core/src/%.ts, core/dist/%.js, $(CORE_TS_FILES))
CORE_NODELIB = core/node_modules/bucketslib/lib/bucketslib.node

NB_NODELIB = nodebuckets/lib/bucketslib.node

APP_NODELIB = app/node_modules/bucketslib/lib/bucketslib.node
APP_TS_FILES = $(shell find app/src/ -type f -name '*.ts')
APP_JS_FILES = $(patsubst app/src/%.ts, app/src/%.js, $(APP_TS_FILES))

.PHONY: all test

all: $(APP_NODELIB)

test: all
	cd ccore && nimble test
	cd nodebuckets && $(MAKE) test
	cd core && tsc && yarn test
	cd app && tsc && yarn test	

$(NB_NODELIB): $(CCORE_NIM_FILES)
	cd nodebuckets && $(MAKE)

$(CORE_NODELIB): $(NB_NODELIB)
	cd core && yarn add file:../nodebuckets

$(CORE_JS_FILES): $(CORE_TS_FILES) $(CORE_NODELIB)
	cd core && tsc

$(APP_NODELIB): $(CORE_NODELIB)
	cd app && yarn add file:../core

$(APP_JS_FILES): $(APP_TS_FILES) $(APP_NODELIB)
	cd app && tsc
