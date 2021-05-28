import Yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as Os from 'os';
import * as Fse from 'fs-extra';
import * as Util from 'util';
import { Shell } from './Shell';
import { Application } from './Application';
import { Daemon } from './Daemon';
const Regedit = require('regedit');
const RegList = Util.promisify(Regedit.list);

export const GAM_PATH = `${Os.homedir()}/.gam`;

const argv = Yargs(hideBin(process.argv)).argv;
const command = argv._[0];

/*try {
  Fse.unlinkSync(`${GAM_PATH}/gam-service.exe`);
  Fse.unlinkSync(`${GAM_PATH}/gam.exe`);
  Fse.unlinkSync(`${GAM_PATH}/node_modules`);
} catch {}*/

// Copy program
try {
} catch {}

(async () => {
  if (command === 'first-init') {
    // Add to Path
    const xxx = await RegList(['HKCU\\Environment']);
    const type = xxx['HKCU\\Environment']['values']['Path']['type'];
    const yyy = xxx['HKCU\\Environment']['values']['Path']['value'].split(';');
    const gpath = GAM_PATH.replace(/\//g, '\\');

    if (!yyy.includes(gpath)) {
      yyy.push(gpath);
      console.log(yyy);
      Regedit.putValue(
        {
          'HKCU\\Environment': {
            Path: {
              type,
              value: yyy.join(';'),
            },
          },
        },
        function (err: any) {
          console.log(err);
        },
      );
    }

    // Create folder
    Fse.mkdirSync(GAM_PATH, { recursive: true });

    // Copy service
    const servicePath = process.argv[0].replace(/\\/g, '/').split('/');
    servicePath.pop();
    servicePath.push(`service.exe`);
    console.log(servicePath.join('/'));
    Fse.copyFileSync(`${servicePath.join('/')}`, `${GAM_PATH}/gam-service.exe`);

    // Copy other
    Fse.copyFileSync(`${process.argv[0]}`, `${GAM_PATH}/gam.exe`);
    Fse.copyFileSync(`${process.argv[0]}/node_modules`, `${GAM_PATH}/node_modules`);
  }

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
