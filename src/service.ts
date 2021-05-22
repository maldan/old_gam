import { WebServer, WS_Router } from '@maldan/tslib-rest-server';
import * as Os from 'os';
import * as ChildProcess from 'child_process';

const PROCESS_LIST = [] as any[];

class MainApi {
  static path: string = 'main';

  static get_index(): unknown {
    return 'hello world';
  }

  static post_run({ app }: { app: string }): unknown {
    const folder = `${Os.homedir()}/gam/${app}`;
    const ch = ChildProcess.spawn(`${folder}/app.exe`, ['--port=58123'], {
      shell: false,
      windowsHide: true,
    });
    PROCESS_LIST.push(ch.pid);
    return `everything is ok ${app}`;
  }

  static get_list(): unknown {
    return PROCESS_LIST;
  }
}

const web = new WebServer([new WS_Router('api', [MainApi]), new WS_Router('', [], ['./build'])]);
web.listen(14392);
