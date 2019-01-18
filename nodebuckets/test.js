var bucketslib = require('./dist/main');

const { main, db_all, db_run, db_executeMany } = bucketslib;

let test_counter = 0;
function dotest(name, func) {
  test_counter++;
  console.log('-'.repeat(40));
  console.log(`TEST ${test_counter} ${name}`);
  func();
}

dotest("version", () => {
  console.log("BucketsLib version:", main.version());
})

// dotest("stringpc", () => {
//   console.log("echo('something'):", main.stringpc("echo", "something"));
//   console.log("unknownthing(''):", main.stringpc("unknownthing", ""));
// })

dotest("register_logger", () => {
  main.register_logger(x => {
    console.log(x);
  })
})

var bf;

dotest("openfile", () => {
  bf = main.openfile(":memory:");
})

dotest("db_all_json", () => {
  let res = main.db_all_json(bf, "SELECT 1,2,3", "[]").toString('utf8');
  console.log("got res");
  console.log(res);
})

dotest("db_all", () => {
  console.log("Nice interface:", db_all(bf, "SELECT 1,2,3"));
})

dotest("db_all error", () => {
  try {
    db_all(bf, "SELECT 1, sd'f");
    console.log("FAILED TO CATCH AN ERROR");
  } catch(err) {
    console.log("Expecting this error:", err);
    console.log(err.toString());
  }
})

dotest("db_executeMany", () => {
  db_executeMany(bf, [
    "CREATE TABLE customer (id INTEGER PRIMARY KEY, email TEXT)",
    "CREATE TABLE company (id INTEGER PRIMARY KEY, name TEXT)",
  ])
})

dotest("db_run", () => {
  var res = db_run(bf, "INSERT INTO company (name) VALUES ('MartinCo')");
  console.log('Insert result:', res);
})

console.log("SUCCESS!");