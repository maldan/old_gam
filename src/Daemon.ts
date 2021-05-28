import Axios from 'axios';
import { Application } from './Application';

export class Daemon {
  static async isRun(): Promise<boolean> {
    try {
      await Axios.get(`http://localhost:14392/api/main/index`);
      return true;
    } catch {
      return false;
    }
  }

  static async reanimate(): Promise<void> {
    if (!(await this.isRun())) {
      await this.restart();
    }
  }

  static async restart(): Promise<void> {
    await this.stop();
    await this.start(); //
  }

  static async start(): Promise<void> {
    return new Promise((resolve: any) => {
      console.log(`Run service...`);
      const spawn = require('child_process').spawn;
      spawn('gam-service', [], {
        stdio: 'ignore',
        detached: true,
      }).unref();

      setTimeout(() => {
        console.log(`Service is running now`);
        resolve();
      }, 1500);
    });
  }

  static async stop(): Promise<void> {
    const find = require('find-process');
    const list = await find('port', 14392);
    if (list[0]) {
      process.kill(list[0].pid);
      console.log('Process killed');
    }
  }

  static async run(url: string): Promise<void> {
    const projectName = Application.urlToProjectName(url);
    await Axios.post(`http://localhost:14392/api/main/run?app=${projectName}`);
  }

  static async status(): Promise<void> {
    try {
      const x = (await Axios.get(`http://localhost:14392/api/main/status`)).data;
      console.log(x);
    } catch {
      console.log(`Can't get status!`);
    }
  }
}
