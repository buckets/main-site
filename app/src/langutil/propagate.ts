import { readFileSync, writeFileSync } from 'fs'
import * as ts from "typescript"
import * as _ from 'lodash'

let fromfile = process.argv[2];
let tofile = process.argv[3];

// console.log('from', fromfile, 'to', tofile);

async function copyEm(fromfile, tofile) {
  let fromdata = openFile(fromfile);
  let newstate = readMessages(fromdata, 'DEFAULTS');

  let todata = openFile(tofile)
  let oldstate = readMessages(todata, 'messages');
  
  let merged = mergeMessages(oldstate.items, newstate.items);

  let guts = [oldstate.pre + ' messages:IMessages = {',
  merged, '}', oldstate.post.trim(), ''].join('\n');
  console.log('guts', guts);
  writeFileSync(tofile, guts);
  console.log('wrote', tofile);
}

function getSrcValue(thing, src:ts.SourceFile):string {
  switch (thing.kind) {
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction: {
      return src.getFullText().slice(thing.pos, thing.end).trim();
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
  let pre_string = null;
  let post_string = null;
  let full_text = src.getFullText();
  let items = {};
  function processNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.VariableDeclaration: {
        let n = node as any;
        if (n.name.escapedText === varname) {
          pre_string = full_text.substr(0, node.pos);
          post_string = full_text.substr(node.end);
          n.initializer.properties.forEach(prop => {
            let init = prop.initializer;
            let item = {
              val: null,
              translated: null,
              src: [],
              orig: null,
            }
            init.properties.forEach(subprop => {
              let key = subprop.name.escapedText;
              let ts_value = getSrcValue(subprop.initializer, src);
              item[key] = ts_value;
            })
            items[prop.name.text] = item;
          })
        }
        break;
      }
    }
    ts.forEachChild(node, processNode);
  }
  processNode(src);
  return {
    pre: pre_string,
    post: post_string,
    items: items,
  }
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
      newval: null,
    };
    if (olditem !== undefined) {
      // existing translation
      item = olditem;
      if (olditem.h !== newitem.h) {
        // it changed
        item['newval'] = newitem.val;
        item['h'] = newitem.h;
        console.warn('ORIGINAL CHANGED', key);
      }
    } else {
      // new key to be translated
      item = newitem;
      console.warn('NEW', key);
    }
    lines.push(`  ${JSON.stringify(key)}: {
    val: ${item.val},
    translated: ${item.translated},
    src: ${item.src},
    h: ${item.h},${item.newval ? `\n    newval: ${item.newval},` : ''}
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
