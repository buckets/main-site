// When you edit/update methods in this file, update the type declaration in jssrc/main.ts accordingly.
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
  info.GetReturnValue().Set(
    Nan::New(
      buckets_version()
    ).ToLocalChecked()
  );
}

// buckets_stringpc
NAN_METHOD(JS_buckets_stringpc) {
  String::Utf8Value v8command(info[0]->ToString());
  String::Utf8Value v8arg(info[1]->ToString());
  char* retval = buckets_stringpc(
    (char *)(*v8command),
    (char *)(*v8arg),
    v8arg.length()
  );
  unsigned int size = strlen(retval);
  info.GetReturnValue().Set(
    Nan::CopyBuffer(retval, size).ToLocalChecked() 
  );
}

// buckets_register_logger
Persistent<Function> r_log;
void JS_callLog(char* msg) {
  if (!r_log.IsEmpty()) {
    Isolate* isolate = Isolate::GetCurrent();
    Local<Function> func = Local<Function>::New(isolate, r_log);
    if (!func.IsEmpty()) {
      const unsigned argc = 1;
      Local<Value> argv[argc] = {
        String::NewFromUtf8(isolate, msg)
      };
      func->Call(Null(isolate), argc, argv);
    }
  }
}
NAN_METHOD(JS_buckets_register_logger) {
  Isolate* isolate = info.GetIsolate();
  if (info[0]->IsFunction()) {
    Local<Function> func = Local<Function>::Cast(info[0]);
    Function * ptr = *func;
    r_log.Reset(isolate, func);
    buckets_register_logger(JS_callLog);
  } else {
    r_log.Reset();
  }
}

// buckets_openfile
NAN_METHOD(JS_buckets_openfile) {
  String::Utf8Value v8filename(info[0]->ToString());
  int retval = buckets_openfile(
    (char *)(*v8filename)
  );
  info.GetReturnValue().Set(retval);
}

// buckets_db_all_json
NAN_METHOD(JS_buckets_db_all_json) {
  int bf_handle = Nan::To<int>(info[0]).FromJust();
  String::Utf8Value v8query(info[1]->ToString());
  String::Utf8Value v8params_json(info[2]->ToString());
  char* retval = buckets_db_all_json(
    bf_handle,
    (char *)(*v8query),
    (char *)(*v8params_json)
  );
  unsigned int size = strlen(retval);
  info.GetReturnValue().Set(
    Nan::CopyBuffer(retval, size).ToLocalChecked() 
  );
}

// buckets_db_run_json
NAN_METHOD(JS_buckets_db_run_json) {
  int bf_handle = Nan::To<int>(info[0]).FromJust();
  String::Utf8Value v8query(info[1]->ToString());
  String::Utf8Value v8params_json(info[2]->ToString());
  char* retval = buckets_db_run_json(
    bf_handle,
    (char *)(*v8query),
    (char *)(*v8params_json)
  );
  unsigned int size = strlen(retval);
  info.GetReturnValue().Set(
    Nan::CopyBuffer(retval, size).ToLocalChecked() 
  );
}

// buckets_db_execute_many_json
NAN_METHOD(JS_buckets_db_execute_many_json) {
  int bf_handle = Nan::To<int>(info[0]).FromJust();
  String::Utf8Value v8queries_json(info[1]->ToString());
  char* retval = buckets_db_execute_many_json(
    bf_handle,
    (char *)(*v8queries_json)
  );
  unsigned int size = strlen(retval);
  info.GetReturnValue().Set(
    Nan::CopyBuffer(retval, size).ToLocalChecked() 
  );
}

//-------------------------
// JS module definition
//-------------------------

void Init(Local<Object> exports) {
  exports->Set(Nan::New("start").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_start)->GetFunction());
  exports->Set(Nan::New("version").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_version)->GetFunction());
  exports->Set(Nan::New("register_logger").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_register_logger)->GetFunction());
  exports->Set(Nan::New("stringpc").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_stringpc)->GetFunction());
  exports->Set(Nan::New("openfile").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_openfile)->GetFunction());
  exports->Set(Nan::New("db_all_json").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_db_all_json)->GetFunction());
  exports->Set(Nan::New("db_run_json").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_db_run_json)->GetFunction());
  exports->Set(Nan::New("db_execute_many_json").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_db_execute_many_json)->GetFunction());
  
}

//-------------------------
NODE_MODULE(bucketslib, Init)

