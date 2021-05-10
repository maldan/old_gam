import Yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = Yargs(hideBin(process.argv)).argv;

const command = argv._[0];
const program = argv._[1];

if (command === 'install') {
}
