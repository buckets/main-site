import * as _ from 'lodash';

interface IMatch<T> {
  handler: T,
  data: {},
}
interface IRouter<T> {
  add(pattern:string, handler:T);
  match(s:string):IMatch<T>;
}

export class DumbRouter<T> implements IRouter<T> {
  private matchers = [];
  constructor(patterns:{[k:string]:T}) {
    _.each(patterns, (value, key) => {
      this.add(key, value);
    })
  }
  add(pattern:string, handler:T) {
    let parts = pattern.split(/(<[a-zA-Z]+?:[a-zA-Z0-9_]*?>)/g);
    let processors = [];
    let regex = parts.map(part => {
      if (part.startsWith('<')) {
        let kv = part.slice(1, -1).split(':');
        let dt = kv[0];
        let name = kv[1];
        let processor = (a => a);
        switch (dt) {
          case 'int': {
            dt = '-?\\d+';
            processor = parseInt;
            break;
          }
          case 'str':
          case 'string': {
            dt = '[^/]*?';
            break;
          }
          default: {
            throw new Error(`Unknown routing type: ${dt}`)
          }
        }
        processors.push((x, ctx) => {
          ctx[name] = processor(x);
        })
        return `(${dt})`;
      } else {
        // normal string
        return part;
      }
    }).join('');
    let re = new RegExp('^' + regex + '$');
    console.log('regex', regex);
    this.matchers.push((x:string) => {
      let m = x.match(re);
      if (m === null) {
        return null;
      } else {
        let data = {};
        m.slice(1).forEach((item, idx) => {
          processors[idx](item, data);
        });
        return {handler, data};
      }
    });
  }
  match(s:string):IMatch<T> {
    for (var i = 0; i < this.matchers.length; i++) {
      let m = this.matchers[i](s);
      if (m !== null) {
        return m;
      }
    }
    throw new Error('Unknown pattern: '+s);
  }
}
