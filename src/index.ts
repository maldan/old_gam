import Yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import Axios from 'axios';
import * as Fs from 'fs';
import * as Os from 'os';
import Progress from 'progress';
import Extract from 'extract-zip';
import Rimraf from 'rimraf';

const argv = Yargs(hideBin(process.argv)).argv;

const command = argv._[0];

async function install(zipName: string, projectName: string) {
  await Extract(`${Os.homedir()}/gam/${zipName}`, { dir: `${Os.homedir()}/gam/${projectName}` });

  Fs.copyFileSync(`${__dirname}/../runbg.exe`, `${Os.homedir()}/gam/${projectName}/run.exe`);

  const createDesktopShortcut = require('create-desktop-shortcuts');
  createDesktopShortcut({
    windows: {
      filePath: `${Os.homedir()}/gam/${projectName}/run.exe`,
      name: `${projectName}`,
      comment: `Run ${projectName}`,
      arguments: `${Os.homedir()}/gam/${projectName}/app.exe`,
      workingDirectory: `${Os.homedir()}/gam/${projectName}`,
    },
  });

  console.log('done');
}

async function download(url: string, projectName: string, version: string): Promise<void> {
  const zipName = `${projectName}_${version}.zip`;

  if (Fs.existsSync(`${Os.homedir()}/gam/${zipName}`)) {
    await install(zipName, projectName);
    return;
  }

  console.log('Connecting...');
  const { data, headers } = await Axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  const totalLength = headers['content-length'];

  console.log('Starting download');
  const progressBar = new Progress('-> downloading [:bar] :percent :etas', {
    width: 40,
    complete: '=',
    incomplete: ' ',
    renderThrottle: 1,
    total: parseInt(totalLength),
  });

  const writer = Fs.createWriteStream(`${Os.homedir()}/gam/${zipName}`);

  data.on('data', (chunk: { length: number }) => progressBar.tick(chunk.length));
  data.pipe(writer);
  data.on('end', async () => {
    install(zipName, projectName);
  });
}

async function stopService() {
  const find = require('find-process');
  const list = await find('port', 14392);
  if (list[0]) {
    process.kill(list[0].pid);
    console.log('Process killed');
  }
}

async function runService() {
  return new Promise((resolve: any) => {
    const spawn = require('child_process').spawn;
    spawn('node', ['./bin/service.js'], {
      stdio: 'ignore',
      detached: true,
    }).unref();

    setTimeout(() => {
      resolve();
    }, 1000);
  });
}

(async () => {
  if (command === 'install') {
    console.log(`Get release list...`);

    // Get release list
    const x = (await Axios.get(`https://api.github.com/repos/${argv._[1]}/releases`)).data;

    // Gam folder
    const projectName = (argv._[1] + '').replace(/\//g, '__');

    // Remove current app
    Rimraf.sync(`${Os.homedir()}/gam/${projectName}`);
    Fs.mkdirSync(`${Os.homedir()}/gam/${projectName}`, { recursive: true });

    // Download
    for (let i = 0; i < x.length; i++) {
      for (let j = 0; j < x[i].assets.length; j++) {
        if (x[i].assets[j].name === 'application.zip') {
          const url = x[i].assets[j].browser_download_url;
          console.log(`Start to download...`);
          await download(url, projectName, x[i].tag_name);
          return;
        }
      }
    }
  }

  if (command === 'run') {
    // Gam folder
    const projectName = (argv._[1] + '').replace(/\//g, '__');

    console.log(projectName);

    // Check service and run if stopped
    try {
      const x = (await Axios.get(`http://localhost:14392/api/main/index`)).data;
      console.log(x);
    } catch {
      await stopService();
      await runService();
    }

    const x = (await Axios.post(`http://localhost:14392/api/main/run?app=${projectName}`)).data;
    console.log(x);
  }

  if (command === 'stop') {
    stopService();
  }

  if (command === 'list') {
    const x = (await Axios.get(`http://localhost:14392/api/main/list`)).data;
    console.log(x);
  }
})();
