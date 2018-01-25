import { copyEm } from './propagate'
import { extract } from './extract_messages'

const command = process.argv[2];
const rest = process.argv.slice(3);

if (command === 'updatelang') {
  copyEm(rest[0], rest[1]);
} else if (command === 'extract') {
  extract(rest[0]);
} else {
  throw new Error(`Unknown subcommand: ${command}`)
}
