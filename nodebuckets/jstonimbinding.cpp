// When you edit/update methods in this file, update the type declaration in jssrc/main.ts accordingly.
#include "napi.h"
#include <clib.h>
#include <iostream>
using namespace std;
using namespace Napi;

// Using buffers: https://community.risingstack.com/using-buffers-node-js-c-plus-plus/

N_CDECL(void, NimMain)(void);

// start
Value start(const CallbackInfo& info) {
  Env env = info.Env();
  // NimMain();
  return env.Undefined();
}

// Return a Buffer containing the string from the most
// recently completed operation.
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
  Buffer<char> buf = info[0].As<Buffer<char>>();
  int retval = buckets_openfile((char*)buf.Data(), buf.Length());
  return Number::New(env, retval);
}

// buckets_db_all_json
Buffer<char> db_all_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  
  Buffer<char> query_buf = info[1].As<Buffer<char>>();
  Buffer<char> params_buf = info[2].As<Buffer<char>>();

  return stringResult(env, buckets_db_all_json(
    bf_handle,
    (char *)(query_buf.Data()),
    query_buf.Length(),
    (char *)(params_buf.Data()),
    params_buf.Length()
  ));
}

// buckets_db_run_json
Buffer<char> db_run_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  Buffer<char> query = info[1].As<Buffer<char>>();
  Buffer<char> params_json = info[2].As<Buffer<char>>();
  return stringResult(env, buckets_db_run_json(
    bf_handle,
    (char *)(query.Data()),
    query.Length(),
    (char *)(params_json.Data()),
    params_json.Length()
  ));
}

// buckets_db_execute_many_json
Buffer<char> db_execute_many_json(const CallbackInfo& info) {
  Env env = info.Env();
  int bf_handle = info[0].As<Number>().Int64Value();
  Buffer<char> queries_json = info[1].As<Buffer<char>>();
  return stringResult(env, buckets_db_execute_many_json(
    bf_handle,
    (char *)(queries_json.Data()),
    queries_json.Length()
  ));
}

Object Init(Env env, Object exports) {
  NimMain();
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
