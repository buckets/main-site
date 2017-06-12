export function callOnce(func) {
  let retval = null;
  let finished = false;
  let pending = [];

  // Call the function immediately
  let p = new Promise((resolve, reject) => {
    try {
      resolve(func());
    } catch(err) {
      reject(err);
    }
  });

  p.then(result => {
    console.log('result', result);
    retval = result;
    finished = true;
    pending.forEach(pended => {
      pended.resolve(retval);
    });
  }, err => {
    console.error(err.stack);
    retval = err;
    finished = true;
    pending.forEach(pended => {
      pended.reject(retval);
    })
  })
  .then(() => {
    pending.length = 0;
  });

  return () => {
    if (finished) {
      return Promise.resolve(retval);
    } else {
      return new Promise((resolve, reject) => {
        pending.push({resolve, reject});
      })
    }
  }
}