import { backendBuild } from '@maldan/tslib-gam-builder';
import * as Path from 'path';
import * as Os from 'os';
import * as Fs from 'fs';

(async () => {
  const TEMP_DIR = `${Os.tmpdir}/gam-tmp/${new Date().getTime()}`.replace(/\\/g, '/');
  Fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Build service
  await backendBuild({
    workingDir: TEMP_DIR,
    backendPath: Path.resolve('./'),
    rootPath: Path.resolve('./'),
    modules: [
      'y18n',
      'yargs-parser',
      'cliui',
      'string-width',
      'strip-ansi',
      'ansi-regex',
      'is-fullwidth-code-point',
      'emoji-regex',
      'wrap-ansi',
      'escalade',
      'get-caller-file',
      'require-directory',
    ],
    inputScript: '/bin/Service.js',
    exeName: 'service.exe',
  });

  // Build gam
  await backendBuild({
    workingDir: TEMP_DIR,
    backendPath: Path.resolve('./'),
    rootPath: Path.resolve('./'),
    modules: [
      'y18n',
      'yargs-parser',
      'cliui',
      'string-width',
      'strip-ansi',
      'ansi-regex',
      'is-fullwidth-code-point',
      'emoji-regex',
      'wrap-ansi',
      'escalade',
      'get-caller-file',
      'require-directory',
    ],
    copyModules: ['regedit', 'create-desktop-shortcuts'],
    zipOut: './application.zip', //
  });
})();
