import { spawn } from 'child_process'

async function run(args:string[]) {

}

async function doBuild(result:'publish'|'dev'|'build') {
  console.log('Starting doBuild', result);

  console.log('doBuild complete', result);
}

if (require.main === module) {
  const command = process.argv[1];
  doBuild(command as any);
}