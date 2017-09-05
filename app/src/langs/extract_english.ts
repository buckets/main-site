import { readFileSync, readdirSync, lstatSync } from 'fs'
import * as Path from 'path'
import * as ts from "typescript"
import * as _ from 'lodash'

// XXX this doesn't actually work yet

function kindToTypeScriptIdentifier(x:ts.SyntaxKind):string {
  switch (x) {
    case ts.SyntaxKind.NumberKeyword: return 'number';
    case ts.SyntaxKind.StringKeyword: return 'string';
    default: return 'any';
  }
}


function openFile(relpath:string):ts.SourceFile {
  return ts.createSourceFile(relpath,
    readFileSync(relpath).toString(),
    ts.ScriptTarget.ES2016);
}

function extractEnglish(src:ts.SourceFile) {
  let ret = {
    interface: {},
    dft: {},
  };
  let dft = ret.dft;
  let iface = ret.interface;
  src.getFullText()
  function processNode(node: ts.Node) {
    // console.log('processNode', node);
    switch (node.kind) {
      case ts.SyntaxKind.CallExpression: {
        // console.log('process node', node);
        let n:any = node;
        // console.log('n escapedText', n.expression.escapedText);
        if (n.expression && n.expression.escapedText === 'sss') {
          let args = n.arguments;
          if (args.length == 1) {
            let key = args[0].text;
            dft[key] = JSON.stringify(key);
            iface[key] = 'string';
          } else if (args.length == 2) {
            let key = args[0].text;
            let kind = args[1].kind;
            switch (kind) {
              case ts.SyntaxKind.FunctionExpression:
              case ts.SyntaxKind.ArrowFunction: {
                let func = args[1];
                let start = func.pos;
                let end = func.end;

                let param_types = [];
                if (func.parameters) {
                  // console.log('func.parameters', func.paremeters)
                  param_types = func.parameters.map(param => {
                    let type = param.type ? kindToTypeScriptIdentifier(param.type.kind) : 'any';
                    let name = param.name.escapedText;
                    return `${name}:${type}`;
                  })
                }
                let snip = src.getFullText().slice(start, end);
                // console.log(func);
                iface[key] = `(${param_types.join(',')})=>string`;
                dft[key] = snip;
                break;
              }
              case ts.SyntaxKind.StringLiteral: {
                dft[key] = JSON.stringify(args[1].text);
                iface[key] = 'string';
                break;
              }
              case ts.SyntaxKind.NumericLiteral: {
                dft[key] = args[1].text;
                iface[key] = 'number';
                break;
              }
              default: {
                iface[key] = 'any';
              }
            }
          }
        } 
      }
    }
    ts.forEachChild(node, processNode);
  }
  processNode(src);
  return ret;
}

function walk(f:string):string[] {
  let stat = lstatSync(f);
  let ret = [];
  if (stat.isDirectory()) {
    let files = readdirSync(f);
    files.forEach(rel => {
      let fp = Path.join(f, rel);
      ret = ret.concat(walk(fp));
    })
  } else if (stat.isFile()) {
    ret.push(f)
  }
  return ret;
}

let data = {
  interface: {},
  dft: {},
}
walk(process.argv[2]).forEach(filename => {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    let fh = openFile(filename);
    let d = extractEnglish(fh);
    Object.assign(data.interface, d.interface);
    Object.assign(data.dft, d.dft);  
  }  
})

function displayInterface(iface:object) {
  let lines = [];
  lines.push('{');
  _.each(iface, (v, k) => {
    lines.push(`  ${JSON.stringify(k)}: ${v};`);
  })
  lines.push('}');
  return lines.join('\n');
}

function displayDefaults(dfts:object) {
  let lines = [];
  lines.push('{');
  _.each(dfts, (v, k) => {
    lines.push(`  ${JSON.stringify(k)}: ${v},`);
  })
  lines.push('}');
  return lines.join('\n');
}
console.log(displayInterface(data.interface));
console.log(displayDefaults(data.dft));
// _.each(data.interface, (v, k) => {
//   console.log(k, v);
// })
// console.log
// _.each(data.dft, (v, k) => {
//   console.log(k, v);
// })
// console.log(JSON.stringify(data, null, 2));

