import { readFileSync, readdirSync, lstatSync } from 'fs'
import * as Path from 'path'
import * as ts from "typescript"
import * as _ from 'lodash'
import * as cheerio from 'cheerio'
import * as crypto from 'crypto'

let ERRORS = [];

// XXX How do I auto-detect these?
export const IMPORTS = `
import * as React from 'react'
import * as moment from 'moment'
`

function hash(x:string):string {
  let h = crypto.createHash('sha256');
  try {
    h.update(x);  
  } catch(err) {
    console.error("Error processing string", x);
    throw err;
  }
  
  return h.digest('base64');
}

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

function formatSource(source:ISource):string {
  return `${source.filename} line ${source.lineno}`
}

function mergeMessages(pot:IMessageSpec, entry:IMessage) {
  let existing = pot[entry.key];
  if (existing) {
    // merge
    if (existing.defaultValue === entry.defaultValue
        && existing.interfaceValue === entry.interfaceValue) {
      existing.sources = existing.sources.concat(entry.sources);
    } else {
      ERRORS.push(`Key '${entry.key}' used incompatibly in ${existing.sources.map(formatSource).join(', ')} and ${formatSource(entry.sources[0])}`);
    }
  } else {
    pot[entry.key] = entry;  
  }
}

function extractMessagesFromTS(pot:IMessageSpec, src:ts.SourceFile) {
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
                let snip = src.getFullText().slice(start, end).trim();
                newitem = {
                  key,
                  defaultValue: snip,
                  interfaceValue: `(${param_types.join(',')})=>string|JSX.Element`,
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
      mergeMessages(pot, newitem);
    }
    ts.forEachChild(node, processNode);
  }
  processNode(src);
}  

function extractMessagesFromHTML(pot:IMessageSpec, filename:string) {
  let html = readFileSync(filename).toString()
  let tree = cheerio.load(html);

  // the data-translate items
  tree('[data-translate]').each((i, elem) => {
    let e = cheerio(elem);
    let key = e.attr('data-translate');
    let val = e.html();
    if (!key) {
      key = val;
    }
    mergeMessages(pot, {
      key,
      defaultValue: JSON.stringify(val),
      interfaceValue: 'string',
      sources: [{filename, lineno:0}],
    });
  })
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

function displayInterface(msgs:IMessageSpec) {
  let lines = [];
  lines.push(`interface IMsg<T> {
  val: T;
  translated: boolean;
  src: string[];
  h: string;
  newval?: T;
}`);
  lines.push('export interface IMessages {');
  _.each(msgs, (msg:IMessage) => {
    lines.push(`  ${JSON.stringify(msg.key)}: IMsg<${msg.interfaceValue}>;`);
  })
  lines.push('}');
  return lines.join('\n');
}

function displayDefaults(msgs:IMessageSpec) {
  let lines = [];
  lines.push('export const DEFAULTS:IMessages = {');
  _.each(msgs, (msg:IMessage) => {
    try {
      lines.push(`  ${JSON.stringify(msg.key)}: {
    val: ${msg.defaultValue},
    translated: false,
    src: ${JSON.stringify(msg.sources.map(formatSource))},
    h: ${JSON.stringify(hash(msg.defaultValue))},
  },`);
    } catch(err) {
      console.error("Error processing msg", msg);
      throw err;
    }
    
  })
  lines.push('}');
  return lines.join('\n');
}

export function extract(directory:string) {
  let MSGS:IMessageSpec = {};
  walk(directory).forEach(filename => {
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      let fh = openFile(filename);
      extractMessagesFromTS(MSGS, fh);
    } else if (filename.endsWith('.html')) {
      extractMessagesFromHTML(MSGS, filename);
    }  
  })
  console.log('// Auto-generated file');
  console.log(IMPORTS);
  console.log(displayInterface(MSGS));
  console.log(displayDefaults(MSGS));

  if (ERRORS.length) {
    ERRORS.forEach(err => {
      console.error(err);
    })
    throw new Error('Error')
  }
}
