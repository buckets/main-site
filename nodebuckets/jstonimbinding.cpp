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

Buffer<char> stringResult(Env env, size_t len) {
  Buffer<char> ret = Buffer<char>::New(env, len);
  buckets_get_result_string(ret.Data());
  return ret;
}

// buckets_version
Buffer<char> version(const CallbackInfo& info) {
  Env env = info.Env();
  return stringResult(env, buckets_version());
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
FunctionReference r_log;
void emitLogInJS(char* msg) {
  if (r_log != nullptr) {
    Env env = r_log.Env();
    String message = String::New(env, msg);
    std::vector<napi_value> args = {message}; 
    r_log.Call(args);
  } 
}
void register_logger(const CallbackInfo& info) {
  r_log = Persistent(info[0].As<Function>());
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
Buffer<char> db_all_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  std::string js_query = info[1].As<Value>().ToString().Utf8Value();
  const char* query = js_query.c_str();
  std::string js_params_json = info[2].As<Value>().ToString().Utf8Value();
  const char* params_json = js_params_json.c_str();
  return stringResult(env, buckets_db_all_json(
    bf_handle,
    (char *)(query),
    (char *)(params_json)
  ));
}

// buckets_db_run_json
Buffer<char> db_run_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  std::string js_query = info[1].As<Value>().ToString().Utf8Value();
  const char* query = js_query.c_str();
  std::string js_params_json = info[2].As<Value>().ToString().Utf8Value();
  const char* params_json = js_params_json.c_str();
  return stringResult(env, buckets_db_run_json(
    bf_handle,
    (char *)(query),
    (char *)(params_json)
  ));
}

// buckets_db_execute_many_json
Buffer<char> db_execute_many_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  std::string js_queries_json = info[1].As<Value>().ToString().Utf8Value();
  const char* queries_json = js_queries_json.c_str();
  // cout << "buckets_db_execute_many_json(" << bf_handle << ", " << queries_json << ")\n";
  return stringResult(env, buckets_db_execute_many_json(
    bf_handle,
    (char *)(queries_json)
  ));
}

Object Init(Env env, Object exports) {
  exports["start"] = Function::New(env, start);
  exports["version"] = Function::New(env, version);
  exports["register_logger"] = Function::New(env, register_logger);
  exports["openfile"] = Function::New(env, openfile);
  exports["db_all_json"] = Function::New(env, db_all_json);
  exports["db_run_json"] = Function::New(env, db_run_json);
  exports["db_execute_many_json"] = Function::New(env, db_execute_many_json);
  return exports;
}

NODE_API_MODULE(bucketslib, Init)
