import Axios from 'axios';
import * as Fs from 'fs';
import Semver from 'semver';
import Rimraf from 'rimraf';
import { GAM_APP_PATH } from '.';
import { Application } from './Application';
import { Daemon } from './Daemon';
import { Gam } from './Gam';

export class Shell {
  static async install(url: string): Promise<boolean> {
    console.log(`Get release list...`);

    const projectUrl = url.replace(`https://github.com/`, ``);
    const projectName = Application.urlToProjectName(projectUrl);

    // Get release list
    let releaseList = [];
    try {
      releaseList = (await Axios.get(`https://api.github.com/repos/${projectUrl}/releases`)).data;
    } catch {
      console.log(`Repo not found!`);
      return false;
    }

    // Remove current app
    Rimraf.sync(`${GAM_APP_PATH}/${projectName}`);
    Fs.mkdirSync(`${GAM_APP_PATH}/${projectName}`, { recursive: true });

    // Search asset
    for (let i = 0; i < releaseList.length; i++) {
      for (let j = 0; j < releaseList[i].assets.length; j++) {
        if (releaseList[i].assets[j].name === 'application.zip') {
          const url = releaseList[i].assets[j].browser_download_url;
          await Application.download(url, projectUrl, releaseList[i].tag_name);
          return true;
        }
      }
    }

    console.log(`Assets not found!`);
    return false;
  }

  static async delete(url: string): Promise<void> {
    if (!url) {
      console.log(`Project name can't be null!`);
      return;
    }

    const projectName = Application.urlToProjectName(url);
    console.log(`${GAM_APP_PATH}/${projectName}`);
    Rimraf.sync(`${GAM_APP_PATH}/${projectName}`);
  }

  static async start(): Promise<void> {
    Daemon.start();
  }

  static async stop(): Promise<void> {
    Daemon.stop();
  }

  static version(): string {
    try {
      return JSON.parse(Fs.readFileSync(`./package.json`, 'utf-8'))['version'];
    } catch {
      return '1.0.0';
    }
  }

  static async upgrade(): Promise<void> {
    // Get release list
    let releaseList = [];
    try {
      releaseList = (await Axios.get(`https://api.github.com/repos/maldan/gam/releases`)).data;
    } catch {
      console.log(`Repo not found!`);
      return;
    }

    for (let i = 0; i < releaseList.length; i++) {
      const version = Semver.coerce(releaseList[i].tag_name)?.version || '0.0.1';

      if (!Semver.gt(version, this.version())) {
        continue;
      }
      for (let j = 0; j < releaseList[i].assets.length; j++) {
        if (releaseList[i].assets[j].name === 'application.zip') {
          const url = releaseList[i].assets[j].browser_download_url;
          await Gam.download(url, releaseList[i].tag_name);
          return;
        }
      }
    }

    console.log('Nothing to upgrade');
  }
}
