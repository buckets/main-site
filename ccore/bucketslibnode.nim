## This file contains the NodeJS bindings into the buckets library.
## It is essentially a C++ file emitted by Nim.
include "bucketslib.nim"

#-------------------------
# JS Functions
#-------------------------

{.emit: """
#include <nan.h>

N_CDECL(void, NimMain)(void);

using namespace v8;

// buckets_start
NAN_METHOD(JS_buckets_start) {
  NimMain();
}

// buckets_version
NAN_METHOD(JS_buckets_version) {
  info.GetReturnValue().Set(Nan::New(buckets_version()).ToLocalChecked());
}

""".}

#-------------------------
# JS module definition
#-------------------------

{.emit: """
void Init(Local<Object> exports) {
  exports->Set(Nan::New("start").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_start)->GetFunction());
  exports->Set(Nan::New("version").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_version)->GetFunction());
}
""".}

#-------------------------

{.emit: """
NODE_MODULE(bucketslib, Init)
""".}
