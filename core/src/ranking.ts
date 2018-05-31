// Return a string that's between the 2 given strings
// such that sorting will put the returned value
// between `start` and `end`
export function rankBetween(start:string, end:string):string {
  let bounds = [start || 'a', end || 'z'];
  if (bounds[0] === bounds[1]) {
    throw new Error(`Can't rank between equal values: ${start}, ${end}`);
  }
  bounds.sort();
  start = bounds[0];
  end = bounds[1];
  let ret = [];
  let length = start.length > end.length ? start.length : end.length;
  for (let i = 0; i < length; i++) {
    let a = start.substr(i, 1) || 'a';
    let b = end.substr(i, 1) || 'z';
    if (a === b) {
      ret.push(a);
    } else {
      let anum = a.charCodeAt(0);
      let bnum = b.charCodeAt(0);
      let newnum = Math.floor((bnum - anum) / 2 + anum);
      ret.push(String.fromCharCode(newnum));
    }
  }
  let retstring = ret.join('');
  if (retstring === start) {
    retstring += 'm';
  }
  return retstring;
}