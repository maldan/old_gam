import { WebServer, WS_Router } from '@maldan/tslib-rest-server';
import * as ChildProcess from 'child_process';
import { GAM_APP_PATH } from '.';

const PROCESS_LIST = [] as any[];

class MainApi {
  static path: string = 'main';

  static get_index(): unknown {
    return 'hello world';
  }

  static post_run({ app }: { app: string }): unknown {
    const folder = `${GAM_APP_PATH}/${app}`;
    const ch = ChildProcess.spawn(`${folder}/app.exe`, ['--port=58123'], {
      shell: false,
      windowsHide: true,
      cwd: folder,
    });
    PROCESS_LIST.push(ch.pid);

    ch.on('exit', () => {
      const i = PROCESS_LIST.indexOf(ch.pid);
      if (i !== -1) {
        PROCESS_LIST.splice(i, 1);
      }
    });

    return `everything is ok2 ${app} ${folder}`;
  }

  static get_status(): unknown {
    return PROCESS_LIST;
  }
}

const web = new WebServer([new WS_Router('api', [MainApi]), new WS_Router('', [], ['./build'])]);
web.listen(14392);

console.log(`Service is run`);
