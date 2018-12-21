const bucketslib = require('./lib/bucketslib.node');
bucketslib.start();

bucketslib.db_all = function(bf_id, query, params) {
  params = params || [];
  let res = JSON.parse(bucketslib.db_all_json(bf_id, query, JSON.stringify(params)));
  console.log("res:", res);
  if (res.err) {
    throw Error(res.err);
  } else {
    return res.rows;
  }
}

bucketslib.db_run = function(bf_id, query, params) {
  params = params || [];
  let res = JSON.parse(bucketslib.db_run_json(bf_id, query, JSON.stringify(params)));
  if (res.err) {
    throw Error(res.err);
  } else {
    return res.lastID;
  }
}

bucketslib.db_executeMany = function(bf_id, queries) {
  let err = bucketslib.db_execute_many_json(bf_id, JSON.stringify(queries));
  if (err) {
    throw Error(err);
  }
}

bucketslib.db_paramArray = function(bf_id, query) {
  let orig = bucketslib.db_param_array_json(bf_id, query);
  let res = JSON.parse(orig);
  console.log("query:", query);
  console.log("vars:", res);
  console.log("orig:", orig);
  return res;
}

module.exports = bucketslib;
