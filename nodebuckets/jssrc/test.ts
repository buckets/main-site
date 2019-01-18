var bucketslib = require('./main');

const { main, db_all, db_run, db_executeMany } = bucketslib;

let test_counter = 0;
async function dotest(name:string, func:Function) {
  test_counter++;
  console.log('-'.repeat(40));
  console.log(`TEST ${test_counter} ${name}`);
  await func();
}

async function mainFunc() {

  await dotest("version", () => {
    console.log("BucketsLib version:", main.version());
  })

  // dotest("stringpc", () => {
  //   console.log("echo('something'):", main.stringpc("echo", "something"));
  //   console.log("unknownthing(''):", main.stringpc("unknownthing", ""));
  // })

  await dotest("register_logger", () => {
    main.register_logger((x:string) => {
      console.log(x);
    })
  })

  var bf:number;

  await dotest("openfile", () => {
    bf = main.openfile(":memory:");
  })

  await dotest("db_all_json", () => {
    let res = main.db_all_json(bf, "SELECT 1,2,3", "[]").toString('utf8');
    console.log("got res");
    console.log(res);
  })

  await dotest("db_all", async () => {
    console.log("Nice interface:", await db_all(bf, "SELECT 1,2,3"));
  })

  await dotest("db_all error", async () => {
    try {
      await db_all(bf, "SELECT 1, sd'f");
      console.log("FAILED TO CATCH AN ERROR");
    } catch(err) {
      console.log("Expecting this error:", err);
      console.log(err.toString());
    }
  })

  await dotest("db_executeMany", async () => {
    await db_executeMany(bf, [
      "CREATE TABLE customer (id INTEGER PRIMARY KEY, email TEXT)",
      "CREATE TABLE company (id INTEGER PRIMARY KEY, name TEXT)",
    ])
  })

  await dotest("db_run", async () => {
    var res = await db_run(bf, "INSERT INTO company (name) VALUES ('MartinCo')");
    console.log('Insert result:', res);
  })

  console.log("SUCCESS!");
}

mainFunc();
