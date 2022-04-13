#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const prompts = require('prompts');
const arg = require('arg');
const chalk = require('chalk');
const replace = require('replace-in-file');

const cwd = process.cwd();

const args = arg({
  '--help': Boolean,
  '--docs': Boolean,
  '--version': Boolean,
  '--example': String,
  '-h': '--help',
  '-d': '--docs',
  '-v': '--version',
  '-e': '--example',
});

if (args['--version']) {
  const pkg = require(path.join(__dirname, 'package.json'));
  console.log(`Vitron v${pkg.version}`);
  process.exit(0);
}

if (args['--help']) {
  console.clear();
  console.log(chalk`{bold.yellow Create Vitron (Electron + Vite)} {grey by Blade}
    
    {bold USAGE}
      {bold $} {cyan create-vitron} --help
      {bold $} {cyan create-vitron} --version
      {bold $} {cyan create-vitron}

    {bold OPTIONS}
      --help,     -h                      shows this help message
      --version,  -v                      displays the current version of create-vitron
  `);
  process.exit(0);
}

if (args['--docs']) {
  showDocs()
  process.exit(0);
}

async function init() {
  console.clear();
  console.log(chalk`
    {bold.red Create Vitron (Electron + Vite)} {dim.grey by Blade}
  `);

  const project = await prompts([
    {
      type: 'text',
      name: 'projectname',
      message: chalk`{bold.yellow Name:}`,
    },
    {
      type: 'select',
      name: 'titlebar',
      message: chalk`{bold.yellow Titlebar:}`,
      choices: [
        { title: 'Yes', description: 'Use Custom Titlebar', value: true },
        { title: 'No', description: 'Use Default Titlebar', value: false },
      ],
      initial: 0,
    },
    {
      type: 'select',
      name: 'tray',
      message: chalk`{bold.yellow Tray:}`,
      choices: [
        { title: 'Yes', description: 'Use SystemTray', value: true },
        { title: 'No', description: 'No SystemTray', value: false },
      ],
      initial: 0,
    },
  ]);

  if (!project.projectname) return;
  const projectName = project.projectname;
  const titlebar = project.titlebar;
  const tray = project.tray;

  
  const template = await prompts([
    {
      type: 'select',
      name: 'value',
      message: chalk`{bold.yellow Template:}`,
      choices: [
        {
          title: 'React-Typescript',
          description: 'more might come',
          value: { repoName: 'vitron' },
        },
      ],
    },
  ]);

  if (!template.value) return;

  const installNodeModules = await prompts([
    {
      type: 'select',
      name: 'value',
      message: chalk`{bold.yellow Install Node Modules:}`,
      choices: [
        { title: 'Yes', description: 'Yes (this will take time)', value: true },
        { title: 'No', description: 'No just scaffold the app', value: false },
      ],
    },
  ]);

  const img2ico = await prompts([
    {
      type: 'select',
      name: 'value',
      message: chalk`{bold.yellow Use custom icon.png:}`,
      choices: [
        { title: 'Yes', description: 'Yes', value: true },
        { title: 'No', description: 'No', value: false },
      ],
    },
  ]);

  const { repoName, branch } = template.value;
  const repo = `https://github.com/yeonv/${repoName}`;
  const spinner = require('./spinner');
  try {
    if (fs.existsSync(projectName) && fs.statSync(projectName).isDirectory()) {
      console.error(`🚧 Directory "${projectName}" already exists.`);
      process.exit(1);
    }
    spinner.create(chalk`{bold.yellow Downloading and extracting...}`);
    await gitClone(repo, projectName, branch);

    fs.rmSync(path.join(cwd, projectName, '.git'), {
      recursive: true,
      force: true,
    });

    spinner.create(chalk`{bold.yellow Configuring App...}`);
    const configured = await replaceName(projectName, titlebar, tray);
    if (configured) {
      spinner.clear();
    }
    
    if (img2ico.value === true) {
      
      const img2icoConfirm = await prompts([
        {
          type: 'select',
          name: 'value',
          message: chalk`{bold.yellow Place ${chalk`{blue icon.png}`} inside of ${chalk`{blue ./${projectName}}`}:}`,
          choices: [
            {
              title: 'Confirm',
              description: `Placed icon.png inside of ${projectName}`,
              value: true,
            },
            {
              title: 'Cancel',
              description: 'Continue without custom icon',
              value: false,
            },
          ],
        },
      ]);
      
      if (img2icoConfirm.value === true) {
        
        await handleIcon(projectName)
      }
    }
    if (installNodeModules.value) {
      const cmd = (await pm()) === 'yarn' ? 'yarn' : 'npm install';
      spinner.create(
        chalk`{bold.yellow Installing Node Modules (grab a coffee)...}`
      );
      cp.execSync(`cd ${path.join(cwd, projectName)} && ${cmd}`, {
        stdio: 'ignore',
      });      
      spinner.clear();
    }
    
    console.log('')
    console.log(chalk`{green DONE!}`)
    console.log('')

    await sleep(2000);

    showDocs(projectName,titlebar,tray, img2ico.value)

  } catch (error) {
    spinner.fail(error);
    process.exit(error);
  }
}

init();


/*  UTILS */

async function pm() {
  const { promisify } = require('util');
  const { exec: defaultExec } = require('child_process');

  let pm = 'yarn';
  const exec = promisify(defaultExec);
  try {
    await exec(`${pm} -v`, { cwd });
  } catch (_) {
    pm = 'npm';
    try {
      await exec(`${pm} -v`, { cwd });
    } catch (_) {
      pm = undefined;
    }
  }

  if (pm === undefined) {
    console.log(
      chalk.yellow(
        'No available package manager! (`npm` or `yarn` is required)'
      )
    );
    process.exit(1);
  }

  return pm;
}

function gitClone(repo, projectName, branch) {
  return new Promise((resolve, reject) => {
    const _branch = branch ? ['-b', branch] : [];
    cp.spawn('git', ['clone', ..._branch, repo, projectName, '--depth', '1'], {
      stdio: 'ignore',
    }).on('close', (code, signal) => {
      if (code) {
        reject(code);
        return;
      }
      resolve(signal);
    });
  });
}

function handleIcon(name) {
  const pngToIco = require('png-to-ico');
  // var png2icons = require("png2icons");

  return new Promise((resolve, reject) => {
    pngToIco(`${name}/icon.png`)
      .then((buf) => {
        fs.writeFileSync(`${name}/resources/icon.ico`,buf);
        fs.writeFileSync(`${name}/resources/installerIcon.ico`,buf);
        fs.writeFileSync(`${name}/resources/uninstallerIcon.ico`,buf);
        // fs.rmSync(`${name}/resources/icon.icns`, {recursive: true,force: true,});       
        // var output = png2icons.createICNS(buf, png2icons.BILINEAR, 0);
        // if (output) {
        //     fs.writeFileSync(`${name}/resources/icon.icns`, output);
        // }
        resize(path.join(name, 'icon.png'),`${name}/resources/icon.png`);
        fs.rmSync(path.join(cwd, name, 'icon.png'), {recursive: true,force: true,});
        resolve()
      })
      .catch(error=>{
        console.log(error)
        reject()
      });
    });
    
}

function replaceName(name, titlebar, tray) {
  return new Promise((resolve, reject) => {
    const options = [
      {
        files: `${name}/package.json`,
        from: /"version": "\d.\d.\d"/g,
        to: `"version": "0.0.1"`,
      },
      {
        files: `${name}/package.json`,
        from: /"description": "\X+"/g,
        to: `"description": "${name} 0.0.1 - supercharged with Vitron (by Blade)"`,
      },
      {
        files: `${name}/package.json`,
        from: /"name": "vitron"/g,
        to: `"name": "${name.toLowerCase()}"`,
      },
      {
        files: [
          `${name}/electron-builder.js`,
          `${name}/electron-builder.json5`,
          `${name}/package.json`,
          `${name}/.github/workflows/release.yml`,
          `${name}/packages/main/index.ts`,
          `${name}/packages/renderer/index.html`,
          `${name}/packages/renderer/vite.config.ts`,
        ],
        from: /Vitron/g,
        to: name,
      },
    ];
    if (!titlebar) {
      options.push({
        files: `${name}/package.json`,
        from: /"VITRON_CUSTOM_TITLEBAR": true/g,
        to: `"VITRON_CUSTOM_TITLEBAR": false`,
      })
    }
    if (!tray) {
      options.push({
        files: `${name}/package.json`,
        from: /"VITRON_TRAY": true/g,
        to: `"VITRON_TRAY": false`,
      })
    }
    for (let index = 0; index < options.length; index++) {
      try {
        const results = replace.sync(options[index]);
        if (!results) return;
        resolve(true);
      } catch (error) {
        console.error('Error occurred:', error);
        reject(error);
      }
    }
  });
}

async function resize(source, target, size = 256) {
  const jimp = require('jimp');
  const image = await jimp.read(source);
  image.resize(size, jimp.AUTO);
  await image.writeAsync(target || source);
  return true;
}

function showDocs(projectName, ptitlebar, ptray, picon, installNodeModules ) {
  
  const name = projectName || 'Vitron'
  const titlebar = ptitlebar === true ? 'custom' : 'default'
  const icon = picon === true ? 'custom' : 'default'
  const tray = ptray === true ? 'yes' : 'no'
  
  
  console.clear();
  console.log(chalk`{grey
  ┌───────────────────────────────────────┐
  │           {bold.red Welcome to Vitron}           │  
  |  {dim Electron + Vite + React + Typescript} |
  ├───────────────────────────────────────┤
  |  Name:      {bold.yellow ${name}}${spaces(26, name)}|
  |  Tray:      {bold.yellow ${tray}}${spaces(26, tray)}|
  |  Icon:      {bold.yellow ${icon}}${spaces(26, icon)}|
  |  Titlebar:  {bold.yellow ${titlebar}}${spaces(26, titlebar)}|
  ├─────────┬──────────────┬──────────────┤
  │         │     APP      │     WEB      │
  ├─────────┼──────────────┼──────────────┤
  │  dev    │  {bold.yellow yarn start}  │  {bold.yellow yarn build}  │
  │  build  │  {bold.yellow yarn dev}    │  {bold.yellow yarn dist}   │
  └─────────┴──────────────┴──────────────┘
                  {dim.grey by Blade}

  To get started run:

  {bold.yellow cd ${name}}
  ${!installNodeModules ? chalk`{bold.yellow yarn
  yarn dev}` : chalk`{bold.yellow yarn dev}`}}`);  
}


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function spaces(max, str) {
  return Array(max - str.length).fill('\xa0').join('')
}