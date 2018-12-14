var buckets = require('./build/Release/bucketslib');
buckets.start();

console.log("Buckets version:", buckets.version());

console.log("SPC:", buckets.stringpc("foo", "bar\u0000and stuff"));
console.log("SPC:", buckets.stringpc("Foo", "bar"));
console.log("SPC:", buckets.stringpc("Hey", "bar"));
