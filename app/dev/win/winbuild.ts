import { spawn } from 'child_process'
import * as fs from 'fs'

let ENV = Object.assign({}, process.env, {
  PYTHON: 'C:\\Users\\IEUser\\.windows-build-tools\\python27\\python.exe',
  PATH: `.\\node_modules\\.bin\\;${process.env.PATH};C:\\Users\\IEUser\\.windows-build-tools\\python27`,
  ELECTRON_BUILDER_CACHE: 'Y:\\cache\\electron-cache',
  ELECTRON_CACHE: 'Y:\\cache\\electron-cache',
})
ENV.Path = ENV.PATH;
let CWD:string;

//--------------------------------------------------------------
// Utilities
//--------------------------------------------------------------
function mkdir(path:string) {
  try {
    fs.mkdirSync(path)
    console.log('mkdir', path);
  } catch(err) {
  }
}
function cat(path:string) {
  console.log(`${path}:`);
  console.log(fs.readFileSync(path).toString())
}

//--------------------------------------------------------------
//--------------------------------------------------------------
let PNUM = 0;
mkdir('C:\\log')
const logfile = 'C:\\log\\winbuild.log';
console.log(`Logging stdout/stderr to ${logfile}`)
const stdout = fs.createWriteStream(logfile, {
  flags: 'w',
});
const stderr = stdout;

async function run(args:string[], opts:{
  env?:object,
  cwd?:string,
  failok?:boolean,
}={}) {
  PNUM++;
  let still_alive_timer;
  let rc;
  try {
    rc = await new Promise((resolve, reject) => {
      const cwd = opts.cwd || CWD;
      console.log(`\n(${PNUM}) SPAWN ${args.join(' ')} @ ${cwd}`)
      const p = spawn('cmd.exe', ['/c', ...args], {
        env: opts.env || ENV,
        stdio: 'pipe',
        cwd,
      });
      still_alive_timer = setInterval(() => {
        console.log(`(${PNUM}) still alive... pid=${p.pid}`)
      }, 30 * 1000)

      let output = new Buffer('');
      p.stdout.on('data', (data:Buffer) => {
        output = Buffer.concat([output, data])
        stdout.write(data.toString());
        process.stdout.write(data.toString());
      })
      p.stderr.on('data', (data:Buffer) => {
        output = Buffer.concat([output, data])
        stderr.write(data.toString());
        process.stderr.write(data.toString());
      })
      p.on('exit', (code, signal) => {
        console.log(`(${PNUM}) EXIT ${code} ${signal ? signal : ''}`);
        if (code !== 0 && !opts.failok) {
          console.error(output.toString());
        }
        resolve(code);
      })
      p.on('error', (err) => {
        console.error(`(${PNUM}) ${err}\n${err.stack}`);
        // console.error(output.toString());
        reject(err);
      })
    })
  } catch(err) {
    throw err
  } finally {
    clearInterval(still_alive_timer);
  }
  if (rc !== 0 && !opts.failok) {
    throw new Error(`Process exited with code: ${args.join(' ')} ${rc}`);
  }
  return rc;
}

//----------------------------------------------------------
// doInstallBuildTools
//----------------------------------------------------------
async function doInstallBuildTools() {
  await run(['npm', 'install', '--global', '--production', 'windows-build-tools'])
  await run(['md', 'C:\\Users\\IEUser\\.windows-build-tools'])
  await run(['xcopy', 'C:\\Users\\Administrator\\.windows-build-tools', 'C:\\Users\\IEUser\\.windows-build-tools', '/s', '/f'])
}

//----------------------------------------------------------
// doInstallNodeGYP
//----------------------------------------------------------
async function doInstallNodeGYP() {
  await run(['npm', 'config', 'set', 'msvs_version', '2015'])
  await run(['npm', 'config', 'set', 'python', 'C:\\Users\\IEUser\\.windows-build-tools\\python27\\python.exe'])
  await run(['npm', 'install', '-g', 'node-gyp'])
}

//----------------------------------------------------------
// doBuild
//----------------------------------------------------------
async function doBuild(result:'publish'|'dev'|'build') {
  console.log('Starting doBuild', result);
  Object.assign(ENV, {
    CSC_LINK: 'Y:\\csc_link.p12',
    CSC_KEY_PASSWORD: fs.readFileSync('Y:\\csc_key_password.txt'),
  })

  // Get files and env vars into place
  console.log('---------------------------------------------')
  console.log('files and vars')
  console.log('---------------------------------------------')
  CWD = 'C:\\'
  mkdir('C:\\proj')
  mkdir('C:\\proj\\app')
  mkdir('C:\\proj\\app\\dist')
  await run(['rmdir', 'c:\\proj\\app\\src', '/s', '/q'], {failok: true})
  await run(['rmdir', 'c:\\proj\\app\\migrations', '/s', '/q'], {failok: true})
  cat('C:\\builder\\copyexclude.txt')
  await run(['xcopy', 'y:\\', 'c:\\proj', '/d', '/F', '/I', '/s', '/Y', '/EXCLUDE:C:\\builder\\copyexclude.txt'])
  await run(['set'])

  
  await run(['npm', 'config', 'set', 'msvs_version', '2015', '--global'])
  await run(['npm', 'install', '-g', 'node-gyp'])

  console.log('---------------------------------------------')
  console.log('configure yarn mirror')
  console.log('---------------------------------------------')
  await run(['yarn', 'config', 'set', 'yarn-offline-mirror', 'y:\\cache\\yarnmirror'])
  await run(['yarn', 'config', 'set', 'yarn-offline-mirror-pruning', 'false'])
  await run(['yarn', 'config', 'list'])

  console.log('---------------------------------------------')
  console.log('compile core')
  console.log('---------------------------------------------')
  CWD = 'C:\\proj\\core'
  await run(['yarn', '--non-interactive', '--ignore-scripts'])
  await run(['yarn', 'compile'])

  console.log('---------------------------------------------')
  console.log('compile app code')
  console.log('---------------------------------------------')
  CWD = 'C:\\proj\\app'
  await run(['yarn', '--non-interactive', '--ignore-scripts'])
  await run(['yarn', 'compile'])

  console.log('---------------------------------------------')
  console.log('build app')
  console.log('---------------------------------------------')
  CWD = 'C:\\proj\\app'
  switch (result) {
    case 'publish': {
      await run(['c:\\proj\\app\\node_modules\\.bin\\build', '--win', '--x64', '--ia32', '-p', 'always'])
      break
    }
    case 'build': {
      await run(['c:\\proj\\app\\node_modules\\.bin\\build', '--win', '--x64', '--ia32'])
      break;
    }
    case 'dev': {
      await run(['yarn', 'start'])
    }
  }

  console.log('---------------------------------------------')
  console.log('copy things back')
  console.log('---------------------------------------------')
  await run(['xcopy', 'c:\\proj\\app\\dist\\.', 'y:\\app\\dist', '/d', '/F', '/I', '/s', '/Y'])

  console.log('ok')
}

async function main() {
  console.log('winbuild.ts starting');
  const command = process.argv[2];
  console.log('command', command);
  try {
    switch (command) {
      case 'installbuildtools': {
        doInstallBuildTools();
        break;
      }
      case 'installnodegyp': {
        doInstallNodeGYP();
        break
      }
      case 'build': {
        const subcommand = process.argv[3] || 'build';
        if (subcommand === 'publish'
          || subcommand === 'dev'
          || subcommand === 'build') {
          doBuild(subcommand);  
        } else {
          throw new Error(`Unknown build subcommand: ${subcommand}`)
        }
        break;
      }
      default: {
        throw new Error(`Unknown command: ${command}`);
      }
    }
  } catch(err) {
    cat(logfile)
    console.error(err.stack)
    console.error(err)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}