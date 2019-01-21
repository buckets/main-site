// When you edit/update methods in this file, update the type declaration in jssrc/main.ts accordingly.
#include "napi.h"
#include <clib.h>
#include <iostream>
using namespace std;
using namespace Napi;

N_CDECL(void, NimMain)(void);

// start
Value start(const CallbackInfo& info) {
  Env env = info.Env();
  NimMain();
  return env.Undefined();
}

// buckets_version
String version(const CallbackInfo& info) {
  Env env = info.Env();
  NimMain();
  return String::New(env, buckets_version());
}

// // buckets_stringpc
// NAN_METHOD(stringpc) {
//   String::Utf8Value v8command(info[0]->ToString());
//   String::Utf8Value v8arg(info[1]->ToString());
//   char* retval = buckets_stringpc(
//     (char *)(*v8command),
//     (char *)(*v8arg),
//     v8arg.length()
//   );
//   unsigned int size = strlen(retval);
//   info.GetReturnValue().Set(
//     Nan::CopyBuffer(retval, size).ToLocalChecked() 
//   );
// }

// buckets_register_logger
// FunctionReference r_log;
// Env r_log_env = nullptr;
void emitLogInJS(char* msg) {
  std::string message_string(msg);
  cout << "TEMP LOG: " << message_string << "\n";
  // if (r_log != nullptr) {
  //   r_log.Call(1, String::New(r_log_env, message_string));
  // } 
}
void register_logger(const CallbackInfo& info) {
  // r_log = Persistent(info[0].As<Function>());
  // r_log_env = info.Env();
  buckets_register_logger(emitLogInJS);
}

// buckets_openfile
Number openfile(const CallbackInfo& info) {
  Env env = info.Env();
  std::string js_filename = info[0].As<Value>().ToString().Utf8Value();
  const char* filename = js_filename.c_str();
  int retval = buckets_openfile(
    (char *)(filename)
  );
  return Number::New(env, retval);
}

// buckets_db_all_json
String db_all_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  std::string js_query = info[1].As<Value>().ToString().Utf8Value();
  const char* query = js_query.c_str();
  std::string js_params_json = info[2].As<Value>().ToString().Utf8Value();
  const char* params_json = js_params_json.c_str();
  char* retval = buckets_db_all_json(
    bf_handle,
    (char *)(query),
    (char *)(params_json)
  );
  return String::New(env, retval);
}

// buckets_db_run_json
String db_run_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  std::string js_query = info[1].As<Value>().ToString().Utf8Value();
  const char* query = js_query.c_str();
  std::string js_params_json = info[2].As<Value>().ToString().Utf8Value();
  const char* params_json = js_params_json.c_str();
  char* retval = buckets_db_run_json(
    bf_handle,
    (char *)(query),
    (char *)(params_json)
  );
  return String::New(env, retval);
}

// buckets_db_execute_many_json
String db_execute_many_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  std::string js_queries_json = info[1].As<Value>().ToString().Utf8Value();
  const char* queries_json = js_queries_json.c_str();
  cout << "buckets_db_execute_many_json(" << bf_handle << ", " << queries_json << ")\n";
  char* retval = buckets_db_execute_many_json(
    bf_handle,
    (char *)(queries_json)
  );
  cout << "finished\n";
  return String::New(env, retval);
}
// NAN_METHOD(db_execute_many_json) {
//   int bf_handle = Nan::To<int>(info[0]).FromJust();
//   String::Utf8Value v8queries_json(info[1]->ToString());
//   char* retval = buckets_db_execute_many_json(
//     bf_handle,
//     (char *)(*v8queries_json)
//   );
//   unsigned int size = strlen(retval);
//   info.GetReturnValue().Set(
//     Nan::CopyBuffer(retval, size).ToLocalChecked() 
//   );
// }

// //-------------------------
// // JS module definition
// //-------------------------

// NAN_MODULE_INIT(Init) {
//   cout << "HELLO WORLD!\n";
//   NimMain();
//   NAN_EXPORT(target, start);
//   NAN_EXPORT(target, version);
//   NAN_EXPORT(target, register_logger);
//   NAN_EXPORT(target, stringpc);
//   NAN_EXPORT(target, openfile);
//   NAN_EXPORT(target, db_all_json);
//   NAN_EXPORT(target, db_run_json);
//   NAN_EXPORT(target, db_execute_many_json);

//   // Set(target, Nan::New("start").ToLocalChecked(),
//   //   GetFunction(Nan::New<FunctionTemplate>(JS_buckets_start)).ToLocalChecked());
//   // Set(target, Nan::New("version").ToLocalChecked(),
//   //   GetFunction(Nan::New<FunctionTemplate>(version)).ToLocalChecked());
//   // Set(target, Nan::New("register_logger").ToLocalChecked(),
//   //   GetFunction(Nan::New<FunctionTemplate>(register_logger)).ToLocalChecked());
//   // Set(target, Nan::New("stringpc").ToLocalChecked(),
//   //   GetFunction(Nan::New<FunctionTemplate>(stringpc)).ToLocalChecked());
//   // Set(target, Nan::New("openfile").ToLocalChecked(),
//   //   GetFunction(Nan::New<FunctionTemplate>(openfile)).ToLocalChecked());
//   // Set(target, Nan::New("db_all_json").ToLocalChecked(),
//   //   GetFunction(Nan::New<FunctionTemplate>(db_all_json)).ToLocalChecked());
//   // Set(target, Nan::New("db_run_json").ToLocalChecked(),
//   //   GetFunction(Nan::New<FunctionTemplate>(db_run_json)).ToLocalChecked());
//   // Set(target, Nan::New("db_execute_many_json").ToLocalChecked(),
//   //   GetFunction(Nan::New<FunctionTemplate>(db_execute_many_json)).ToLocalChecked());
// }

// NODE_MODULE(bucketslib, Init)

// // void Init(Local<Object> exports) {
// //   exports->Set(Nan::New("start").ToLocalChecked(), Nan::New<FunctionTemplate>(JS_buckets_start)->GetFunction());
// //   exports->Set(Nan::New("version").ToLocalChecked(), Nan::New<FunctionTemplate>(version)->GetFunction());
// //   exports->Set(Nan::New("register_logger").ToLocalChecked(), Nan::New<FunctionTemplate>(register_logger)->GetFunction());
// //   exports->Set(Nan::New("stringpc").ToLocalChecked(), Nan::New<FunctionTemplate>(stringpc)->GetFunction());
// //   exports->Set(Nan::New("openfile").ToLocalChecked(), Nan::New<FunctionTemplate>(openfile)->GetFunction());
// //   exports->Set(Nan::New("db_all_json").ToLocalChecked(), Nan::New<FunctionTemplate>(db_all_json)->GetFunction());
// //   exports->Set(Nan::New("db_run_json").ToLocalChecked(), Nan::New<FunctionTemplate>(db_run_json)->GetFunction());
// //   exports->Set(Nan::New("db_execute_many_json").ToLocalChecked(), Nan::New<FunctionTemplate>(db_execute_many_json)->GetFunction());
// // }
// // NODE_MODULE(bucketslib, Init)
// //-------------------------


Object Init(Env env, Object exports) {
  exports.Set(String::New(env, "start"),
    Function::New(env, start));
  exports.Set(String::New(env, "version"),
    Function::New(env, version));
  exports.Set(String::New(env, "register_logger"),
    Function::New(env, register_logger));
  exports.Set(String::New(env, "openfile"),
    Function::New(env, openfile));
  exports.Set(String::New(env, "db_all_json"),
    Function::New(env, db_all_json));
  exports.Set(String::New(env, "db_run_json"),
    Function::New(env, db_run_json));
  exports.Set(String::New(env, "db_execute_many_json"),
    Function::New(env, db_execute_many_json));
  return exports;
}

NODE_API_MODULE(bucketslib, Init)
