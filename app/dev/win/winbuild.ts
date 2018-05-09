import { spawn } from 'child_process'
import * as fs from 'fs'

let ENV = {
  PYTHON: 'C:\\Users\\IEUser\\.windows-build-tools\\python27\\python.exe',
  PATH: `${process.env.PATH};C:\\Users\\IEUser\\.windows-build-tools\\python27`,
  ELECTRON_BUILDER_CACHE: 'Y:\\cache\\electron-cache',
  ELECTRON_CACHE: 'Y:\\cache\\electron-cache',
  // CSC_LINK: 'Y:\\csc_link.p12',
  // CSC_KEY_PASSWORD: fs.readFileSync('Y:\\csc_key_password.txt'),
}

let PNUM = 0;
const logfile = 'C:\\proj\\winbuild.log';
console.log(`logging stdout/stderr to ${logfile}`)
const stdout = fs.createWriteStream('C:\\proj\\winbuild.log');
const stderr = stdout;

async function run(args:string[]) {
  PNUM++;
  const rc = await new Promise((resolve, reject) => {
    console.log(`${PNUM} [SPAWN] ${args.join(' ')}`)
    const p = spawn('cmd.exe', ['/c', ...args]);
    let output = new Buffer('');
    p.stdout.on('data', (data:Buffer) => {
      output = Buffer.concat([output, data])
      stdout.write(data.toString());
    })
    p.stderr.on('data', (data:Buffer) => {
      output = Buffer.concat([output, data])
      stderr.write(data.toString());
    })
    p.on('exit', (code, signal) => {
      console.error(`${PNUM} [EXIT] ${code} ${signal}`);
      if (code !== 0) {
        console.error(output.toString());
      }
      resolve(code);
    })
    p.on('error', (err) => {
      console.error(`${PNUM} ${err}\n${err.stack}`);
      console.error(output.toString());
      reject(err);
    })
  })
  if (rc !== 0) {
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

  await run(['npm', 'config', 'set', 'msvs_version', '2015', '--global'])
  await run(['npm', 'install', '-g', 'node-gyp'])

  console.log('doBuild complete', result);
}

if (require.main === module) {
  console.log('winbuild.ts starting');
  const command = process.argv[1];
  console.log('command', command);
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
      const subcommand = process.argv[2] || 'build';
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
  doBuild(command as any);
}