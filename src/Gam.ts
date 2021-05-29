import Axios from 'axios';
import * as Fs from 'fs';
import * as Fse from 'fs-extra';
import * as Os from 'os';
import * as ChildProcess from 'child_process';

import Progress from 'progress';
import Extract from 'extract-zip';
import { GAM_PATH } from '.';
import { Daemon } from './Daemon';

function getFiles(dir: string, files_: string[]) {
  files_ = files_ || [];
  const files = Fse.readdirSync(dir);
  for (const i in files) {
    const name = dir + '/' + files[i];
    if (Fse.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_.map((x) => {
    return x.replace(/\\/g, '/');
  });
}

export class Gam {
  static async download(zipUrl: string, version: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const zipName = `gam_${version}.zip`;

      // Check archive
      if (Fs.existsSync(`${Os.tmpdir()}/${zipName}`)) {
        await this.unpack(`${Os.tmpdir()}/${zipName}`);
        return;
      }

      console.log(`Connecting...`);
      const { data, headers } = await Axios({
        url: zipUrl,
        method: 'GET',
        responseType: 'stream',
      });
      const totalLength = headers['content-length'];

      console.log(`Starting download ${(totalLength / 1048576).toFixed(2)} MB`);
      const progressBar = new Progress('-> downloading [:bar] :percent :etas', {
        width: 40,
        complete: '=',
        incomplete: ' ',
        renderThrottle: 1,
        total: parseInt(totalLength),
      });

      const writer = Fs.createWriteStream(`${Os.tmpdir()}/${zipName}`);

      data.on('data', (chunk: { length: number }) => progressBar.tick(chunk.length));
      data.pipe(writer);
      data.on('end', async () => {
        await this.unpack(`${Os.tmpdir()}/${zipName}`);
        resolve();
      });
      data.on('error', (e: Error) => {
        reject(e);
      });
    });
  }

  static async unpack(zipPath: string): Promise<void> {
    await Daemon.stop();

    const files = getFiles(GAM_PATH, []);
    files.forEach((x) => {
      try {
        Fse.unlinkSync(x);
        console.log(`Removed ${x}`);
      } catch {
        console.log(`Can't remove ${x}`);
      }
    });
    try {
      Fse.rmSync(`${GAM_PATH}/node_modules`, { recursive: true, force: true });
      console.log('Removed old modules');
    } catch {}

    await Extract(`${zipPath}`, { dir: `${GAM_PATH}` });

    /*try {
      Fse.unlinkSync(`${GAM_PATH}/repo.json`);
    } catch {}

    try {
      Fse.unlinkSync(`${GAM_PATH}/gam__new.exe`);
    } catch {}

    try {
      Fse.unlinkSync(`${GAM_PATH}/gam__update.cmd`);
    } catch {}

    try {
      Fse.unlinkSync(`${GAM_PATH}/package.json`);
    } catch {}

    try {
      Fse.unlinkSync(`${GAM_PATH}/gam-service.exe`);
      console.log('Removed old gam service');
    } catch {}
    try {
      Fse.rmSync(`${GAM_PATH}/node_modules`, { recursive: true, force: true });
      console.log('Removed old modules');
    } catch {}

    Fse.copyFileSync(`${Os.tmpdir()}/${name}/gam.exe`, `${GAM_PATH}/gam__new.exe`);

    // Copy other
    Fse.copyFileSync(`${Os.tmpdir()}/${name}/gam__update.cmd`, `${GAM_PATH}/gam__update.cmd`);
    Fse.copyFileSync(`${Os.tmpdir()}/${name}/repo.json`, `${GAM_PATH}/repo.json`);
    Fse.copyFileSync(`${Os.tmpdir()}/${name}/package.json`, `${GAM_PATH}/package.json`);
    Fse.copyFileSync(`${Os.tmpdir()}/${name}/gam-service.exe`, `${GAM_PATH}/gam-service.exe`);
    Fse.copySync(`${Os.tmpdir()}/${name}/node_modules`, `${GAM_PATH}/node_modules`);*/

    ChildProcess.spawn(`${GAM_PATH}/gam__update.cmd`, [], {
      detached: true,
      cwd: GAM_PATH,
      stdio: 'ignore',
    }).unref();
    setTimeout(() => {
      console.log('Exit');
      process.exit(0);
    }, 500);
  }
}
