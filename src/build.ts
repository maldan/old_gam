import { backendBuild } from '@maldan/tslib-gam-builder';
import * as Path from 'path';
import * as Os from 'os';
import * as Fs from 'fs';

(async () => {
  const TEMP_DIR = `${Os.tmpdir}/gam-tmp/${new Date().getTime()}`.replace(/\\/g, '/');
  Fs.mkdirSync(TEMP_DIR, { recursive: true });
  Fs.copyFileSync('./install.cmd', `${TEMP_DIR}/install.cmd`);
  Fs.copyFileSync('./update.cmd', `${TEMP_DIR}/gam__update.cmd`);
  Fs.copyFileSync('./repo.json', `${TEMP_DIR}/repo.json`);

  try {
    Fs.unlinkSync(`./bin/package.json`);
  } catch {}
  Fs.copyFileSync('./package.json', `./bin/package.json`);

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
    exeName: 'gam-service.exe',
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
    resources: [`${Path.resolve('./')}/package.json`],
    exeName: 'app.exe',
    copyModules: ['regedit', 'create-desktop-shortcuts'],
    zipOut: './application.zip', //
  });
})();
