#include <nan.h>
#include <clib.h>

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

// buckets_stringpc
NAN_METHOD(JS_buckets_stringpc) {
  String::Utf8Value v8command(info[0]->ToString());
  String::Utf8Value v8arg(info[1]->ToString());
  info.GetReturnValue().Set(
    Nan::New(
      buckets_stringpc(
        (char *)(*v8command),
        (char *)(*v8arg),
        v8arg.length()
      )
    ).ToLocalChecked()
  );
}

//-------------------------
// JS module definition
//-------------------------

void Init(Local<Object> exports) {
  exports->Set(Nan::New("start").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_start)->GetFunction());
  exports->Set(Nan::New("version").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_version)->GetFunction());
  exports->Set(Nan::New("stringpc").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_stringpc)->GetFunction());
}

//-------------------------
NODE_MODULE(bucketslib, Init)

