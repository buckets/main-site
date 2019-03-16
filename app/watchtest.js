#!/usr/bin/env node

let _ = require('lodash');
let { spawn } = require('child_process');
let fs = require('fs');
let running = false;
let pending = false;

const run = _.debounce(() => {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  let child;
  try {
    console.log('RUNNING');
    child = spawn('./test.sh', {
      stdio: 'inherit',
    });  
  } catch(err) {
    console.log('ERROR spawning', err);
    process.exit(1);
  }
  
  child.on('exit', () => {
    running = false;
    if (pending) {
      pending = false;
      run();
    }
  })
}, 400, {leading: false, trailing: true});

try {
  run();
  let watcher = fs.watch('src', {recursive: true}, (ev, filename) => {
    if (filename.endsWith('.js')) {
      console.log(filename, 'changed');
      run();  
    }
  });
} catch(err) {
  console.log('ERROR watching', err);
  process.exit(1);
}
