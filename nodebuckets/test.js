var bucketslib = require('./dist/main');

const { main, db_all, db_run, db_executeMany, db_paramArray } = bucketslib;

console.log("BucketsLib version:", main.version());

console.log("echo('something'):", main.stringpc("echo", "something"));
console.log("unknownthing(''):", main.stringpc("unknownthing", ""));

var bf = main.openfile(":memory:");
console.log("SELECT:", main.db_all_json(bf, "SELECT 1,2,3", "[]"));
console.log("Nice interface:", db_all(bf, "SELECT 1,2,3"));
try {
  db_all(bf, "SELECT 1, sd'f");
  console.log("FAILED TO CATCH AN ERROR");
} catch(err) {
  console.log("Expecting this error:");
  console.log(err.toString());
}

db_executeMany(bf, [
  "CREATE TABLE customer (id INTEGER PRIMARY KEY, email TEXT)",
  "CREATE TABLE company (id INTEGER PRIMARY KEY, name TEXT)",
])

var res = db_run(bf, "INSERT INTO company (name) VALUES ('MartinCo')");
console.log('Insert result:', res);

db_paramArray(bf, "SELECT $name, $something");

console.log("SUCCESS!");