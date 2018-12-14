var libbuckets = require('./build/Release/bucketslib');
libbuckets.start();

console.log("Buckets version: " + libbuckets.version());
