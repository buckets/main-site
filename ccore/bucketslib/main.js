var buckets = require('./build/Release/bucketslib');
// buckets.start();

console.log("Buckets version:", buckets.version());

console.log("SPC:", buckets.stringpc("foo", "bar\u0000and stuff"));
console.log("SPC:", buckets.stringpc("Foo", "bar"));
console.log("SPC:", buckets.stringpc("Hey", "bar"));
//console.log("Really long string:", buckets.stringpc("Foo", "a".repeat(100000000)).length);
console.log("BAR result:", buckets.stringpc("bar", "hey"));
