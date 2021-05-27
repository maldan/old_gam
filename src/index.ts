import Yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as Os from 'os';
import { Shell } from './Shell';
import { Application } from './Application';
import { Daemon } from './Daemon';
export const GAM_PATH = `${Os.homedir()}/gam`;

const argv = Yargs(hideBin(process.argv)).argv;
console.log(process.argv);
const command = argv._[0];

(async () => {
  if (command === 'install') {
    await Shell.install(argv._[1] + '');
  }

  if (command === 'run') {
    let status = true;
    if (!Application.exists(argv._[1] + '')) {
      console.log(`Application not found!`);
      console.log(`Trying to install...`);
      status = await Shell.install(argv._[1] + '');
    }

    await Daemon.reanimate();

    if (status) {
      console.log(`Trying to run...`);
      await Daemon.run(argv._[1] + '');
    }
  }

  if (command === 'start') {
    Shell.start();
  }

  if (command === 'stop') {
    Shell.stop();
  }

  if (command === 'delete') {
    await Shell.delete((argv._[1] || '') + '');
  }

  if (command === 'status') {
    await Daemon.reanimate();
    await Daemon.status();
  }
})();
