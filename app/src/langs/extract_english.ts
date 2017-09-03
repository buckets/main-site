import { readFileSync } from 'fs'
import * as Path from 'path'
import * as ts from "typescript"

// XXX this doesn't actually work yet


function openFile(relpath:string):ts.SourceFile {
  return ts.createSourceFile(relpath,
    readFileSync(relpath).toString(),
    ts.ScriptTarget.ES2016);
}

function extractEnglish(src:ts.SourceFile) {
  let ret = {};
  function processNode(node: ts.Node) {
    // console.log('processNode', node);
    switch (node.kind) {
      case 181: {
        // console.log('process node', node);
        let n:any = node;
        // console.log('n escapedText', n.expression.escapedText);
        if (n.expression) {
          let expexp = n.expression.expression;
          let expname = n.expression.name;
          if (expexp && expexp.escapedText === 'tx' && expname.escapedText === 'sss') {
            // console.log('tx.sss node', node);
            let args = n.arguments;
            let key = args[0].text;
            let value = args[1].text;
            ret[key] = value;
          }
        } 
      }
    }
    ts.forEachChild(node, processNode);
  }
  processNode(src);
  return ret;
}

let f = openFile('src/budget/accounts.tsx');
let data = extractEnglish(f);
console.log(JSON.stringify(data, null, 2));

