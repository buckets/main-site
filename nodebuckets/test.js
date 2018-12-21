var buckets = require('./main');
buckets.start();

console.log("BucketsLib version:", buckets.version());

console.log("echo('something'):", buckets.stringpc("echo", "something"));
console.log("unknownthing(''):", buckets.stringpc("unknownthing", ""));

var bf = buckets.openfile(":memory:");
console.log("SELECT:", buckets.db_all_json(bf, "SELECT 1,2,3", "[]"));
console.log("Nice interface:", buckets.db_all(bf, "SELECT 1,2,3"));
try {
  buckets.db_all(bf, "SELECT 1, sd'f");
} catch(err) {
  console.log(err.toString());
}

buckets.db_executeMany(bf, [
  "CREATE TABLE customer (id INTEGER PRIMARY KEY, email TEXT)",
  "CREATE TABLE company (id INTEGER PRIMARY KEY, name TEXT)",
])

var res = buckets.db_run(bf, "INSERT INTO company (name) VALUES ('MartinCo')");
console.log('Insert result:', res);

buckets.db_paramArray(bf, "SELECT $name, $something");