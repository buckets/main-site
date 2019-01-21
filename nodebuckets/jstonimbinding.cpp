// When you edit/update methods in this file, update the type declaration in jssrc/main.ts accordingly.
#include <nan.h>
#include <clib.h>
#include <iostream>
using namespace std;

N_CDECL(void, NimMain)(void);

using namespace v8;

// buckets_start
NAN_METHOD(start) {
  //NimMain();
}

// buckets_version
NAN_METHOD(version) {
  info.GetReturnValue().Set(
    Nan::New(
      buckets_version()
    ).ToLocalChecked()
  );
}

// buckets_stringpc
NAN_METHOD(stringpc) {
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
NAN_METHOD(register_logger) {
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
NAN_METHOD(openfile) {
  String::Utf8Value v8filename(info[0]->ToString());
  int retval = buckets_openfile(
    (char *)(*v8filename)
  );
  info.GetReturnValue().Set(retval);
}

// buckets_db_all_json
NAN_METHOD(db_all_json) {
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
NAN_METHOD(db_run_json) {
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
NAN_METHOD(db_execute_many_json) {
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

NAN_MODULE_INIT(Init) {
  cout << "HELLO WORLD!\n";
  NimMain();
  NAN_EXPORT(target, start);
  NAN_EXPORT(target, version);
  NAN_EXPORT(target, register_logger);
  NAN_EXPORT(target, stringpc);
  NAN_EXPORT(target, openfile);
  NAN_EXPORT(target, db_all_json);
  NAN_EXPORT(target, db_run_json);
  NAN_EXPORT(target, db_execute_many_json);

  // Set(target, Nan::New("start").ToLocalChecked(),
  //   GetFunction(Nan::New<FunctionTemplate>(JS_buckets_start)).ToLocalChecked());
  // Set(target, Nan::New("version").ToLocalChecked(),
  //   GetFunction(Nan::New<FunctionTemplate>(version)).ToLocalChecked());
  // Set(target, Nan::New("register_logger").ToLocalChecked(),
  //   GetFunction(Nan::New<FunctionTemplate>(register_logger)).ToLocalChecked());
  // Set(target, Nan::New("stringpc").ToLocalChecked(),
  //   GetFunction(Nan::New<FunctionTemplate>(stringpc)).ToLocalChecked());
  // Set(target, Nan::New("openfile").ToLocalChecked(),
  //   GetFunction(Nan::New<FunctionTemplate>(openfile)).ToLocalChecked());
  // Set(target, Nan::New("db_all_json").ToLocalChecked(),
  //   GetFunction(Nan::New<FunctionTemplate>(db_all_json)).ToLocalChecked());
  // Set(target, Nan::New("db_run_json").ToLocalChecked(),
  //   GetFunction(Nan::New<FunctionTemplate>(db_run_json)).ToLocalChecked());
  // Set(target, Nan::New("db_execute_many_json").ToLocalChecked(),
  //   GetFunction(Nan::New<FunctionTemplate>(db_execute_many_json)).ToLocalChecked());
}

NODE_MODULE(bucketslib, Init)

// void Init(Local<Object> exports) {
//   exports->Set(Nan::New("start").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_start)->GetFunction());
//   exports->Set(Nan::New("version").ToLocalChecked(), Nan::New<FunctionTemplate>(version)->GetFunction());
//   exports->Set(Nan::New("register_logger").ToLocalChecked(), Nan::New<FunctionTemplate>(register_logger)->GetFunction());
//   exports->Set(Nan::New("stringpc").ToLocalChecked(), Nan::New<FunctionTemplate>(stringpc)->GetFunction());
//   exports->Set(Nan::New("openfile").ToLocalChecked(), Nan::New<FunctionTemplate>(openfile)->GetFunction());
//   exports->Set(Nan::New("db_all_json").ToLocalChecked(), Nan::New<FunctionTemplate>(db_all_json)->GetFunction());
//   exports->Set(Nan::New("db_run_json").ToLocalChecked(), Nan::New<FunctionTemplate>(db_run_json)->GetFunction());
//   exports->Set(Nan::New("db_execute_many_json").ToLocalChecked(), Nan::New<FunctionTemplate>(db_execute_many_json)->GetFunction());
// }
// NODE_MODULE(bucketslib, Init)
//-------------------------


