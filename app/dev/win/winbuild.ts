import { spawn } from 'child_process'
import * as fs from 'fs'

let ENV = Object.assign({}, process.env, {
  PYTHON: 'C:\\Users\\IEUser\\.windows-build-tools\\python27\\python.exe',
  PATH: `.\\node_modules\\.bin\\;${process.env.PATH};${process.env.APPDATA}\\npm\\;C:\\Users\\IEUser\\.windows-build-tools\\python27`,
  ELECTRON_BUILDER_CACHE: 'Y:\\cache\\electron-cache',
  ELECTRON_CACHE: 'Y:\\cache\\electron-cache',
  VCTargetsPath: 'C:\\Program Files (x86)\\MSBuild\\Microsoft.cpp\\v4.0\\v140',
})
ENV.Path = ENV.PATH;
let CWD:string;

//--------------------------------------------------------------
// Utilities
//--------------------------------------------------------------
function mkdir(path:string) {
  try {
    fs.mkdirSync(path)
    PNUM++;
    console.log(`(${++PNUM}) mkdir ${path}`);
  } catch(err) {
  }
}
function cat(path:string) {
  console.log(`(${++PNUM}) cat ${path}`);
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
  hideoutput?:boolean
}={}) {
  PNUM++;
  let still_alive_timer;
  let rc;
  try {
    rc = await new Promise((resolve, reject) => {
      const cwd = opts.cwd || CWD;
      console.log(`\n(${PNUM}) SPAWN ${args.join(' ')} @ ${cwd}`)
      const start = Date.now();
      const p = spawn('cmd.exe', ['/c', ...args], {
        env: opts.env || ENV,
        stdio: 'pipe',
        cwd,
      });
      still_alive_timer = setInterval(() => {
        console.log(`(${PNUM}) ${(new Date()).toISOString()} still alive... pid=${p.pid}`)
      }, 30 * 1000)

      let output = Buffer.from('');
      p.stdout.on('data', (data:Buffer) => {
        output = Buffer.concat([output, data])
        stdout.write(data.toString());
        if (!opts.hideoutput) {
          process.stdout.write(data.toString());
        }
      })
      p.stderr.on('data', (data:Buffer) => {
        output = Buffer.concat([output, data])
        stderr.write(data.toString());
        if (!opts.hideoutput) {
          process.stderr.write(data.toString());
        }
      })
      p.on('exit', (code, signal) => {
        const end = Date.now();
        const seconds = (end - start)/1000;
        console.log(`(${PNUM}) EXIT ${code} ${Math.floor(seconds)}s ${signal ? signal : ''}`);
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
  await run(['npm', 'install', '--global', '--production', 'windows-build-tools', '--vs2015'], {
    hideoutput: true,
  })
  await run(['yarn', 'global', 'add', 'windows-build-tools', '--vs2015'])
  await run(['npm', 'config', 'list'])
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
  console.log('')
  console.log('---------------------------------------------')
  console.log('files and vars')
  console.log('---------------------------------------------')
  CWD = 'C:\\'
  mkdir('C:\\proj')
  mkdir('C:\\proj\\app')
  mkdir('C:\\proj\\app\\dist')
  await run(['rmdir', 'c:\\proj\\core\\src', '/s', '/q'], {failok: true})
  await run(['rmdir', 'c:\\proj\\core\\migrations', '/s', '/q'], {
    failok: true})
  await run(['rmdir', 'c:\\proj\\app\\src', '/s', '/q'], {failok: true})
  cat('C:\\builder\\copyexclude.txt')
  await run(['xcopy', 'y:\\', 'c:\\proj', '/f', '/I', '/s', '/Y', '/EXCLUDE:C:\\builder\\copyexclude.txt'])
  await run(['set'])

  
  await run(['npm', 'config', 'set', 'msvs_version', '2015', '--global'])
  await run(['npm', 'install', '-g', 'node-gyp'])
  await run(['yarn', 'global', 'add', 'node-gyp'])

  console.log('')
  console.log('---------------------------------------------')
  console.log('configure yarn mirror')
  console.log('---------------------------------------------')
  await run(['yarn', 'config', 'set', 'yarn-offline-mirror', 'y:\\cache\\yarnmirror'])
  await run(['yarn', 'config', 'set', 'yarn-offline-mirror-pruning', 'false'])
  await run(['yarn', 'config', 'list'])

  console.log('')
  console.log('---------------------------------------------')
  console.log('compile everything')
  console.log('---------------------------------------------')
  CWD = 'C:\\proj'
  await run(['nake', 'deepclean'])
  await run(['nake', 'app'])
  // await run([""])

  // console.log('')
  // console.log('---------------------------------------------')
  // console.log('compile nodebuckets')
  // console.log('---------------------------------------------')
  // CWD = 'C:\\proj\\nodebuckets'
  // await run(['rmdir', '/S', '/Q', 'node_modules'], {failok: true})
  // await run(['yarn', '--non-interactive', "--ignore-scripts"])
  // await run(['yarn', '--non-interactive'])
  // await run(['tsc', '--version'])
  // await run(['tsc'])

  // console.log('')
  // console.log('---------------------------------------------')
  // console.log('compile core')
  // console.log('---------------------------------------------')
  // CWD = 'C:\\proj\\core'
  // await run(['rmdir', '/S', '/Q', 'node_modules'], {failok: true})
  // await run(['yarn', '--non-interactive', "--ignore-scripts"])
  // await run(['yarn', '--non-interactive'])
  // await run(['tsc', '--version'])
  // await run(['yarn', 'compile'])

  // console.log('')
  // console.log('---------------------------------------------')
  // console.log('compile app code')
  // console.log('---------------------------------------------')
  // CWD = 'C:\\proj\\app'
  // await run(['rmdir', '/S', '/Q', 'node_modules'], {failok: true})
  // await run(['yarn', '--non-interactive', "--ignore-scripts"])
  // await run(['yarn', '--non-interactive'])
  // await run(['tsc', '--version'])
  // await run(['yarn', 'compile'])

  console.log('')
  console.log('---------------------------------------------')
  console.log('build app')
  console.log('---------------------------------------------')
  CWD = 'C:\\proj\\app'
  await run(['electron-builder', '--version'])
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

  console.log('')
  console.log('---------------------------------------------')
  console.log('copy things back')
  console.log('---------------------------------------------')
  await run(['xcopy', 'c:\\proj\\app\\dist\\.', 'y:\\app\\dist', '/f', '/I', '/s', '/Y'])

  console.log('\nok\n')
}

async function main() {
  const main_start = Date.now();
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
        break;
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
  const tdiff = (Date.now() - main_start)/1000;
  console.log(`(${tdiff}s elapsed)`)
}

if (require.main === module) {
  main()
}