import Yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as Os from 'os';
import * as Fse from 'fs-extra';
import * as Util from 'util';
import { Shell } from './Shell';
import { Application } from './Application';
import { Daemon } from './Daemon';
const Regedit = require('regedit');
const RegList = Util.promisify(Regedit.list);

export const GAM_PATH = Os.platform() === 'win32' ? `${Os.homedir()}/.gam` : `/usr/local/bin`;
export const GAM_APP_PATH = `${Os.homedir()}/.gam-app`;

const argv = Yargs(hideBin(process.argv)).argv;
const command = argv._[0];

(async () => {
  if (command === 'first-init') {
    // Add to Path
    if (Os.platform() === 'win32') {
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
    }

    // Create folder
    Fse.mkdirSync(GAM_PATH, { recursive: true });

    // Copy other
    if (Os.platform() === 'win32') {
      Fse.copyFileSync(`${process.argv[0]}`, `${GAM_PATH}/gam.exe`);
    } else {
      Fse.copyFileSync(`${process.argv[0]}`, `${GAM_PATH}/gam`);
    }

    // Copy modules
    const pp = process.argv[0].replace(/\\/g, '/').split('/').slice(0, -1).join('/');
    Fse.copySync(`${pp}/node_modules`, `${GAM_PATH}/node_modules`);
  }

  if (command === 'install') {
    await Shell.install(Application.findInRepo(argv._[1]));
  }

  if (command === 'upgrade') {
    await Shell.upgrade();
  }

  if (command === 'version') {
    console.log(Shell.version());
  }

  if (command === 'run') {
    let status = true;
    if (!Application.exists(Application.findInRepo(argv._[1]))) {
      console.log(`Application not found!`);
      console.log(`Trying to install...`);
      status = await Shell.install(Application.findInRepo(argv._[1]));
    }

    await Daemon.reanimate();

    if (status) {
      console.log(`Trying to run...`);
      await Daemon.run(Application.findInRepo(argv._[1]));
    }
  }

  if (command === 'gam-service') {
    Shell.gamServiceStart();
  }

  if (command === 'start') {
    Shell.start();
  }

  if (command === 'stop') {
    Shell.stop();
  }

  if (command === 'delete') {
    await Shell.delete(Application.findInRepo(argv._[1]));
  }

  if (command === 'status') {
    await Daemon.reanimate();
    await Daemon.status();
  }
})();
