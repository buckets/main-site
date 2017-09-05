import { readFileSync } from 'fs'
import * as ts from "typescript"
import * as _ from 'lodash'

let fromfile = process.argv[2];
let tofile = process.argv[3];

// console.log('from', fromfile, 'to', tofile);

async function copyEm(fromfile, tofile) {
  let fromdata = openFile(fromfile);
  let newstate = readMessages(fromdata, 'DEFAULTS');
  // console.log('new', newstate);
  let todata = openFile(tofile)
  let oldstate = readMessages(todata, 'messages');
  // console.log('old', oldstate);
  let merged = mergeMessages(oldstate, newstate);
  // console.log('merged', merged);
  console.log('const messages:IMessages = {');
  console.log(merged);
  console.log('}');
}

function getSrcValue(thing, src:ts.SourceFile):string {
  switch (thing.kind) {
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction: {
      return src.getFullText().slice(thing.pos, thing.end);
    }
    case ts.SyntaxKind.StringLiteral: {
      return JSON.stringify(thing.text);
    }
    case ts.SyntaxKind.FalseKeyword: {
      return 'false';
    }
    case ts.SyntaxKind.TrueKeyword: {
      return 'true';
    }
    case ts.SyntaxKind.ArrayLiteralExpression: {
      let guts = thing.elements.map((subthing) => getSrcValue(subthing, src));
      return `[${guts.join(',')}]`;
    }
    default: {
      console.error('thing', thing);
      throw new Error(`Unknown value type: ${thing}`);
    }
  }
}

function readMessages(src:ts.SourceFile, varname:string) {
  let items = {};
  function processNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.VariableDeclaration: {
        let n = node as any;
        if (n.name.escapedText === varname) {
          n.initializer.properties.forEach(prop => {
            let init = prop.initializer;
            let item = {
              val: null,
              translated: null,
              src: [],
              orig: null,
            }
            // console.log('init', init);
            // console.log('props[0]', init.properties[0]);
            // console.log('props[1]', init.properties[1]);
            // console.log('props[2]', init.properties[2]);
            init.properties.forEach(subprop => {
              let key = subprop.name.escapedText;
              let ts_value = getSrcValue(subprop.initializer, src);
              // console.log('subprop val', ts_value);
              item[key] = ts_value;
            })
            items[prop.name.text] = item;
            // switch (init.kind) {
            //   case ts.SyntaxKind.FunctionExpression:
            //   case ts.SyntaxKind.ArrowFunction: {
            //     console.log('init', init);
            //     let snip = src.getFullText().slice(init.pos, init.end);
            //     console.log('snip', snip);
            //     items[prop.name.text] = snip;
            //     break;
            //   }
            //   case ts.SyntaxKind.StringLiteral: {
            //     items[prop.name.text] = JSON.stringify(prop.initializer.text);
            //     break;
            //   }
            //   default: {
            //     throw new Error(`Unknown value type: ${prop}`);
            //   }
            // }
          })
        }
        break;
      }
    }
    ts.forEachChild(node, processNode);
  }
  processNode(src);
  return items;
}

function mergeMessages(oldstuff:object, newstuff:object):string {
  let lines = [];
  _.each(newstuff, (newitem, key) => {
    let olditem = oldstuff[key];
    let item = {
      val: null,
      translated: false,
      src: [],
      h: null,
      changed: false,
    };
    if (olditem !== undefined) {
      // existing translation
      item = olditem;
      if (olditem.h !== newitem.h) {
        // it changed
        item['changed'] = true;
      }
    } else {
      // new key to be translated
      item = newitem;
    }
    lines.push(`  ${JSON.stringify(key)}: {
    val: ${item.val},
    translated: ${item.translated},
    src: ${item.src},
    h: ${item.h},${item.changed ? '\n  changed: true,' : ''}
  },`);
  })
  return lines.join('\n');
}


copyEm(fromfile, tofile);


function openFile(filename:string):ts.SourceFile {
  return ts.createSourceFile(filename,
    readFileSync(filename).toString(),
    ts.ScriptTarget.ES2016);
}
