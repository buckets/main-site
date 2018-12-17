var buckets = require('./lib/bucketslib.node');
buckets.start();

console.log("BucketsLib version:", buckets.version());

console.log("echo('something'):", buckets.stringpc("echo", "something"));
console.log("unknownthing(''):", buckets.stringpc("unknownthing", ""));

