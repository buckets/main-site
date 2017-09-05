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

interface ISource {
  filename: string;
  lineno: number;
}
interface IMessage {
  key: string;
  defaultValue: string;
  interfaceValue: string;
  sources: ISource[];
}
interface IMessageSpec {
  [k:string]: IMessage;
}

function extractEnglish(src:ts.SourceFile) {
  let ret:IMessageSpec = {};
  function processNode(node: ts.Node) {
    let newitem:IMessage = null;
    switch (node.kind) {
      case ts.SyntaxKind.CallExpression: {
        let n:any = node;
        let lineno = src.getLineAndCharacterOfPosition(n.pos).line;
        let filename = src.fileName;
        if (n.expression && n.expression.escapedText === 'sss') {
          let args = n.arguments;
          if (args.length == 1) {
            let key = args[0].text;
            newitem = {
              key: key,
              defaultValue: JSON.stringify(key),
              interfaceValue: 'string',
              sources: [{filename, lineno}],
            }
            // dft[key] = JSON.stringify(key);
            // iface[key] = 'string';
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
                  param_types = func.parameters.map(param => {
                    let type = param.type ? kindToTypeScriptIdentifier(param.type.kind) : 'any';
                    let name = param.name.escapedText;
                    return `${name}:${type}`;
                  })
                }
                let snip = src.getFullText().slice(start, end);
                newitem = {
                  key,
                  defaultValue: snip,
                  interfaceValue: `(${param_types.join(',')})=>string`,
                  sources: [{filename, lineno}],
                }
                break;
              }
              case ts.SyntaxKind.StringLiteral: {
                newitem = {
                  key,
                  defaultValue: JSON.stringify(args[1].text),
                  interfaceValue: 'string',
                  sources: [{filename, lineno}],
                }
                break;
              }
              case ts.SyntaxKind.NumericLiteral: {
                newitem = {
                  key,
                  defaultValue: args[1].text,
                  interfaceValue: 'number',
                  sources: [{filename, lineno}],
                }
                break;
              }
              default: {
                newitem = {
                  key,
                  defaultValue: key,
                  interfaceValue: 'any',
                  sources: [{filename, lineno}],
                }
              }
            }
          }
        } 
      }
    }
    if (newitem) {
      let existing = ret[newitem.key];
      if (existing) {
        // merge
        if (existing.defaultValue === newitem.defaultValue && existing.interfaceValue === newitem.interfaceValue) {
          existing.sources = existing.sources.concat(newitem.sources);
        } else {
          console.warn(`Duplicate mismatching key: ${newitem.key}`);
        }
      } else {
        ret[newitem.key] = newitem;  
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

let MSGS:IMessageSpec = {};
walk(process.argv[2]).forEach(filename => {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
    let fh = openFile(filename);
    let d = extractEnglish(fh);
    Object.assign(MSGS, d);
  }  
})

function displayInterface(msgs:IMessageSpec) {
  let lines = [];
  lines.push('{');
  _.each(msgs, (msg:IMessage) => {
    lines.push(`  ${JSON.stringify(msg.key)}: ${msg.interfaceValue};`);
  })
  lines.push('}');
  return lines.join('\n');
}

function displayDefaults(msgs:IMessageSpec) {
  let lines = [];
  lines.push('{');
  _.each(msgs, (msg:IMessage) => {
    lines.push('');
    msg.sources.forEach(source => {
      lines.push(`  // ${source.filename} line ${source.lineno}`);
    })
    lines.push(`  ${JSON.stringify(msg.key)}: ${msg.defaultValue},`);
  })
  lines.push('}');
  return lines.join('\n');
}

console.log(displayInterface(MSGS));
console.log(displayDefaults(MSGS));

// _.each(data.interface, (v, k) => {
//   console.log(k, v);
// })
// console.log
// _.each(data.dft, (v, k) => {
//   console.log(k, v);
// })
// console.log(JSON.stringify(data, null, 2));

