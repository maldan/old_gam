import Axios from 'axios';
import * as Fs from 'fs';
import Rimraf from 'rimraf';
import { GAM_PATH } from '.';
import { Application } from './Application';
import { Daemon } from './Daemon';

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
    Rimraf.sync(`${GAM_PATH}/${projectName}`);
    Fs.mkdirSync(`${GAM_PATH}/${projectName}`, { recursive: true });

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
    console.log(`${GAM_PATH}/${projectName}`);
    Rimraf.sync(`${GAM_PATH}/${projectName}`);
  }

  static async start(): Promise<void> {
    Daemon.start();
  }

  static async stop(): Promise<void> {
    Daemon.stop();
  }
}
