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

function readMessages(src:ts.SourceFile, varname:string) {
  let items = {};
  function processNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.VariableDeclaration: {
        let n = node as any;
        if (n.name.escapedText === varname) {
          // console.log('init', init.properties);
          n.initializer.properties.forEach(prop => {
            let init = prop.initializer;
            switch (init.kind) {
              case ts.SyntaxKind.FunctionExpression:
              case ts.SyntaxKind.ArrowFunction: {
                // console.log('init', init);
                let snip = src.getFullText().slice(init.pos, init.end);
                // console.log('snip', snip);
                items[prop.name.text] = snip;
                break;
              }
              case ts.SyntaxKind.StringLiteral: {
                items[prop.name.text] = JSON.stringify(prop.initializer.text);
                break;
              }
              default: {
                throw new Error(`Unknown value type: ${prop}`);
              }
            }
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
  _.each(newstuff, (newval, key) => {
    let oldval = oldstuff[key];
    let val;
    if (oldval !== undefined) {
      // existing translation
      val = oldval;
    } else {
      // new key to be translated
      lines.push('  // TO TRANSLATE')
      val = newval;
    }
    lines.push(`  ${JSON.stringify(key)}: ${val},`);
  })
  return lines.join('\n');
}


copyEm(fromfile, tofile);


function openFile(filename:string):ts.SourceFile {
  return ts.createSourceFile(filename,
    readFileSync(filename).toString(),
    ts.ScriptTarget.ES2016);
}
