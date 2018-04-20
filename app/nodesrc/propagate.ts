import { readFileSync, writeFileSync } from 'fs'
import { Console } from 'console'
import { extractTranslatorComments } from './extract_messages'
import * as ts from "typescript"
import * as _ from 'lodash'

const log = new Console(process.stderr, process.stderr);

export async function copyEm(fromfile, tofile) {
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
      let context = src.getFullText().slice(thing.pos-50, thing.end+50);
      console.error('Unknown value type:', thing);
      console.error('Context:', context);
      throw new Error(`Unknown value type: ${thing}`);
    }
  }
}

interface IMessage {
  val: any;
  translated: boolean;
  comments: string[];
  orig: any;
  h: string;
  newval?: any;
}

function readMessages(src:ts.SourceFile, varname:string) {
  let pre_string = null;
  let post_string = null;
  let full_text = src.getFullText();
  let items:{
    [k:string]: IMessage;
  } = {};
  function processNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.VariableDeclaration: {
        let n = node as any;
        if (n.name.escapedText === varname) {
          pre_string = full_text.substr(0, node.pos);
          post_string = full_text.substr(node.end);
          
          n.initializer.properties.forEach(prop => {
            const text = full_text.slice(prop.pos, prop.end);
            const comments = extractTranslatorComments(text)
            let init = prop.initializer;
            let item = {
              val: null,
              translated: null,
              src: [],
              orig: null,
              h: null,
              comments: comments,
            }
            if (comments.length) {
              log.info('comments', comments)
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

function mergeMessages(oldstuff:{[k:string]:IMessage}, newstuff:{[k:string]:IMessage}):string {
  let lines = [];
  _.each(newstuff, (newitem, key) => {
    if (newitem.comments.length) {
      log.info('newitem.comments', newitem.comments);
    }
    let olditem = oldstuff[key];
    let item = {
      val: null,
      translated: false,
      h: null,
      newval: null,
      comments: [],
    };
    if (olditem !== undefined) {
      // existing translation
      item = olditem as any;
      item.comments = newitem.comments;
      if (olditem.h !== newitem.h) {
        // it changed
        item.newval = newitem.val;
        item.h = newitem.h;
      }
    } else {
      // new key to be translated
      item = newitem as any;
      console.warn('NEW', key);
    }
    if (item.newval) {
      item.translated = false;
      item.comments.push('TRANSLATION CHANGED')
      item.comments.push('1. Translate "newval: ..."')
      item.comments.push('2. Delete the old "val: ..."')
      item.comments.push('3. Rename "newval" to "val"');
      console.warn('ORIGINAL CHANGED', key);
    }
    log.info('item.comments', item.comments);
    const comments = item.comments.length ? '\n    '+item.comments.map(c => `/*! ${c} */`).join('\n    ') : '';
    log.info('comment string', comments);
    lines.push(`  ${JSON.stringify(key)}: {${comments}${item.newval ? `\n    newval: ${item.newval},` : ''}
    val: ${item.val},
    translated: ${item.translated},
    h: ${item.h},
  },`);
  })
  return lines.join('\n');
}

// try {
//   copyEm(fromfile, tofile);  
// } catch(err) {
//   console.log(err);
//   console.error(err.stack);
//   throw err;
// }


function openFile(filename:string):ts.SourceFile {
  return ts.createSourceFile(filename,
    readFileSync(filename).toString(),
    ts.ScriptTarget.ES2016);
}
