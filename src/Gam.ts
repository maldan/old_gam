import Axios from 'axios';
import * as Fs from 'fs';
import * as Fse from 'fs-extra';
import * as Os from 'os';
import * as Util from 'util';
import Rimraf from 'rimraf';
import Progress from 'progress';
import Extract from 'extract-zip';
import { GAM_PATH } from '.';
import { Daemon } from './Daemon';

const RemoveDir = Util.promisify(Rimraf);

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
    const name = `gam_${new Date().getTime()}`;
    await Extract(`${zipPath}`, { dir: `${Os.tmpdir()}/${name}` });

    await Daemon.stop();

    try {
      Fse.unlinkSync(`${GAM_PATH}/gam_2.exe`);
    } catch {}

    try {
      Fse.unlinkSync(`${GAM_PATH}/package.json`);
    } catch {}
    try {
      Fse.unlinkSync(`${GAM_PATH}/gam.exe`);
      console.log('Removed old gam');
    } catch {}
    try {
      Fse.unlinkSync(`${GAM_PATH}/gam-service.exe`);
      console.log('Removed old gam service');
    } catch {}
    try {
      await RemoveDir(`${GAM_PATH}/node_modules`);
      console.log('Removed old modules');
    } catch {}

    // Copy other
    Fse.copyFileSync(`${Os.tmpdir()}/${name}/package.json`, `${GAM_PATH}/package.json`);
    Fse.copyFileSync(`${Os.tmpdir()}/${name}/app.exe`, `${GAM_PATH}/gam.exe`);
    Fse.copyFileSync(`${Os.tmpdir()}/${name}/service.exe`, `${GAM_PATH}/gam-service.exe`);
    Fse.copySync(`${Os.tmpdir()}/${name}/node_modules`, `${GAM_PATH}/node_modules`);
  }
}
