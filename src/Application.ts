import Axios from 'axios';
import * as Fs from 'fs';
import Progress from 'progress';
import Extract from 'extract-zip';
import { GAM_PATH } from '.';

export class Application {
  static async download(zipUrl: string, projectUrl: string, version: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const projectName = this.urlToProjectName(projectUrl);
      const zipName = `${projectName}_${version}.zip`;

      // Check archive
      if (Fs.existsSync(`${GAM_PATH}/${zipName}`)) {
        await this.unpack(`${GAM_PATH}/${zipName}`, projectUrl);
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

      const writer = Fs.createWriteStream(`${GAM_PATH}/${zipName}`);

      data.on('data', (chunk: { length: number }) => progressBar.tick(chunk.length));
      data.pipe(writer);
      data.on('end', async () => {
        await this.unpack(`${GAM_PATH}/${zipName}`, projectUrl);
        resolve();
      });
      data.on('error', (e: Error) => {
        reject(e);
      });
    });
  }

  static async unpack(zipPath: string, projectUrl: string): Promise<void> {
    const projectName = this.urlToProjectName(projectUrl);
    await Extract(`${zipPath}`, { dir: `${GAM_PATH}/${projectName}` });

    // Create bat executable
    Fs.writeFileSync(
      `${GAM_PATH}/${projectName}/run.cmd`,
      `node "C:/Program Files/nodejs/node_modules/gam/bin/index.js" run "${projectUrl}"`,
    );

    // Create shortcut
    const createDesktopShortcut = require('create-desktop-shortcuts');
    createDesktopShortcut({
      windows: {
        filePath: `${GAM_PATH}/${projectName}/run.cmd`,
        name: `${projectName}`,
        comment: `Run ${projectName}`,
        workingDirectory: `${GAM_PATH}/${projectName}`,
      },
    });

    console.log('Unpacked successfully...');
  }

  static exists(url: string): boolean {
    const projectName = this.urlToProjectName(url);
    return Fs.existsSync(`${GAM_PATH}/${projectName}`);
  }

  static urlToProjectName(url: string): string {
    return (url + '').replace(`https://github.com/`, ``).replace(/\//g, '__');
  }
}
