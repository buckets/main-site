import * as bucketslib from './main'

let test_counter = 0;
async function dotest(name:string, func:Function) {
  test_counter++;
  console.log('-'.repeat(40));
  console.log(`TEST ${test_counter} ${name}`);
  await func();
}

console.log("bucketslib", bucketslib);

async function mainFunc() {

  await dotest("version", () => {
    console.log("BucketsLib version:", bucketslib.version());
  })

  // dotest("stringpc", () => {
  //   console.log("echo('something'):", main.stringpc("echo", "something"));
  //   console.log("unknownthing(''):", main.stringpc("unknownthing", ""));
  // })

  await dotest("registerLogger", () => {
    bucketslib.registerLogger((x:string) => {
      console.log(x);
    })
  })

  var bf:number;

  await dotest("openfile", () => {
    bf = bucketslib.openfile(":memory:");
  })

  await dotest("db_all_json", () => {
    let res = bucketslib.internal.db_all_json(bf, Buffer.from("SELECT 1,2,3"), Buffer.from("[]")).toString('utf8');
    console.log("got res");
    console.log(res);
  })

  await dotest("db_all", async () => {
    console.log("Nice interface:", await bucketslib.db_all(bf, "SELECT 1,2,3"));
  })

  await dotest("db_all error", async () => {
    try {
      await bucketslib.db_all(bf, "SELECT 1, sd'f");
      console.log("FAILED TO CATCH AN ERROR");
    } catch(err) {
      console.log("Expecting this error:", err);
      console.log(err.toString());
    }
  })

  await dotest("db_executeMany", async () => {
    await bucketslib.db_executeMany(bf, [
      "CREATE TABLE customer (id INTEGER PRIMARY KEY, email TEXT)",
      "CREATE TABLE company (id INTEGER PRIMARY KEY, name TEXT)",
    ])
  })

  await dotest("db_run", async () => {
    var res = await bucketslib.db_run(bf, "INSERT INTO company (name) VALUES ('MartinCo')");
    console.log('Insert result:', res);
  })

  const expected_sqlite_version = "3.26.0";

  await dotest(`SQLite version ${expected_sqlite_version}`, async () => {
    const res = await bucketslib.db_all<{v:string}>(bf, "SELECT sqlite_version() as v");
    const actual = res[0].v;
    if (actual !== expected_sqlite_version) {
      throw new Error(`Expected SQLite version to be ${expected_sqlite_version} not ${actual}`);
    }
  })

  console.log("SUCCESS!");
}

mainFunc();
