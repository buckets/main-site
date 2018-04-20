import { readFileSync, readdirSync, lstatSync } from 'fs'
import { Console } from 'console'
import * as Path from 'path'
import * as ts from "typescript"
import * as fs from 'fs'
import * as cheerio from 'cheerio'
import * as crypto from 'crypto'

let ERRORS = [];
const log = new Console(process.stderr, process.stderr);
log.info('starting');

export const DEFAULTS_IMPORTS = `
import * as React from 'react'
import * as moment from 'moment'
import { IMessages } from './base'
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
  log.info('Opening file', relpath);
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
  comments?: string[];
  defaultValue: string;
  interfaceValue: string;
  sources: ISource[];
}
interface IMessageSpec {
  [k:string]: IMessage;
}

function formatSource(source:ISource):string {
  return `${Path.basename(source.filename)}:${source.lineno}`
}

function mergeMessages(pot:IMessageSpec, entry:IMessage) {
  let existing = pot[entry.key];
  if (existing) {
    // merge
    if (existing.defaultValue === entry.defaultValue
        && existing.interfaceValue === entry.interfaceValue) {
      existing.sources = existing.sources.concat(entry.sources);
      if (existing.comments || entry.comments) {
        existing.comments = [...existing.comments || [], ...entry.comments || []];
      }
    } else {
      ERRORS.push(`Key '${entry.key}' used incompatibly in ${existing.sources.map(formatSource).join(', ')} and ${formatSource(entry.sources[0])}`);
    }
  } else {
    pot[entry.key] = entry;  
  }
}

const comment_pattern = /\/\*.*?\*\//g
export function extractTranslatorComments(x:string):string[] {
  let m;
  let ret = [];
  do {
    m = comment_pattern.exec(x);
    if (m) {
      const comment = m[0].slice('/*'.length, -'*/'.length).trim()
      if (comment) {
        ret.push(comment);  
      }
    }
  } while (m);
  return ret;
}

function extractMessagesFromTS(pot:IMessageSpec, src:ts.SourceFile) {
  const full_text = src.getFullText();
  function processNode(node: ts.Node) {
    let newitem:IMessage = null;
    switch (node.kind) {
      case ts.SyntaxKind.CallExpression: {
        let n:any = node;
        let lineno = src.getLineAndCharacterOfPosition(n.pos).line;
        let filename = src.fileName;
        if (n.expression && n.expression.escapedText === 'sss') {
          let args = n.arguments;
          const text = full_text.slice(n.pos, n.end);
          const comments = extractTranslatorComments(text);
          if (args.length == 1) {
            // Simple translation where key is the string being translated
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
          if (comments.length) {
            newitem.comments = comments;
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
    let comment = e.attr('data-comment');
    let val = e.html();
    if (!key) {
      key = val;
    }
    mergeMessages(pot, {
      key,
      defaultValue: JSON.stringify(val),
      interfaceValue: 'string',
      sources: [{filename, lineno:0}],
      comments: comment ? [comment] : undefined,
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
  h: string;
  newval?: T;
}`);
  lines.push('export interface IMessages {');
  const keys = Object.keys(msgs);
  keys.sort()
  keys.forEach(key => {
    const msg:IMessage = msgs[key];
    lines.push(`  ${JSON.stringify(msg.key)}: IMsg<${msg.interfaceValue}>;`);
  })
  lines.push('}');
  return lines.join('\n');
}

function displayDefaults(msgs:IMessageSpec) {
  let lines = [];
  lines.push('export const DEFAULTS:IMessages = {');
  const keys = Object.keys(msgs);
  keys.sort()
  keys.forEach(key => {
    const msg:IMessage = msgs[key];
    try {
      const comments = msg.comments !== undefined ? '\n    ' + msg.comments.map(c => `/* ${c} */`).join('\n    ') : '';
      lines.push(`  ${JSON.stringify(msg.key)}: {${comments}
    val: ${msg.defaultValue},
    translated: false,
    h: ${JSON.stringify(hash(msg.defaultValue))},
${msg.sources.map(x => '    // '+formatSource(x)).join('\n')}
  },`);
    } catch(err) {
      console.error("Error processing msg", msg);
      throw err;
    }
    
  })
  lines.push('}');
  return lines.join('\n');
}

export function extract(directory:string, base_filename:string, defaults_filename:string) {
  let MSGS:IMessageSpec = {};
  walk(directory).forEach(filename => {
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      let fh = openFile(filename);
      extractMessagesFromTS(MSGS, fh);
    } else if (filename.endsWith('.html')) {
      extractMessagesFromHTML(MSGS, filename);
    }  
  })
  fs.writeFileSync(base_filename, [
    '// Auto-generated file',
    displayInterface(MSGS),
    '',
  ].join('\n\n'))
  fs.writeFileSync(defaults_filename, [
    '// Auto-generated file',
    DEFAULTS_IMPORTS,
    displayDefaults(MSGS),
    '',
  ].join('\n\n'))

  if (ERRORS.length) {
    ERRORS.forEach(err => {
      console.error(err);
    })
    throw new Error('Error')
  }
}
