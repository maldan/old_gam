import { Builder } from '@maldan/tslib-gam-builder';

(async () => {
  const b = new Builder();

  await b.copyFiles('./bin/**/*', '/', 1);
  await b.copyFiles('./node_modules/**/*', '/');
  await b.copyFile('./package.json', '/package.json');

  const modules = [
    'yargs',
    'y18n',
    'yargs-parser',
    'yargs-unparser',
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
    'regedit',
    'create-desktop-shortcuts',
  ] as string[];

  await b.build({
    targetOs: `windows-14.15.3`,
    output: `./out-windows/app.exe`,
    resources: ['./package.json', `./node_modules/{${modules.join(',')}}/**/*`],
  });
  await b.build({
    targetOs: `linux-14.15.3`,
    output: `./out-linux/app`,
    resources: ['./package.json', `./node_modules/{${modules.join(',')}}/**/*`],
  });

  await b.copyFile('./install.sh', '/out-linux/install.sh');

  await b.copyFile('./install.cmd', '/out-windows/install.cmd');
  await b.copyFile('./update.cmd', '/out-windows/gam__update.cmd');

  //for (let i = 0; i < modules.length; i++) {
  //  await b.copyFiles(`./node_modules/${modules[i]}/**/*`, '/out-windows');
  //  await b.copyFiles(`./node_modules/${modules[i]}/**/*`, '/out-linux');
  //}

  await b.zip(`./application-windows-x64.zip`, '/out-windows');
  await b.zip(`./application-linux-x64.zip`, '/out-linux');

  /*const TEMP_DIR = `${Os.tmpdir}/gam-tmp/${new Date().getTime()}`.replace(/\\/g, '/');
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
    rootPath: Path.resolve('./'), //
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
    copyModules: ['regedit', 'create-desktop-shortcuts'],
    exeName: 'app.exe',
    zipOut: './application.zip', //
  });*/
})();
