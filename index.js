#!/usr/bin/env node

const fs = require('fs');
const cp = require('child_process');
const prompts = require('prompts');
const arg = require('arg');
const path = require('path');
const chalk = require('chalk');
const cwd = process.cwd();
const utils = require('./utils')

const args = arg({
  '--help': Boolean,
  '--docs': Boolean,
  '--version': Boolean,
  '-h': '--help',
  '-d': '--docs',
  '-v': '--version',
});

if (args['--version']) {
  const pkg = require(path.join(__dirname, 'package.json'));
  console.log(`Vitron v${pkg.version}`);
  process.exit(0);
}

if (args['--help']) {
  utils.showHelp()
  process.exit(0);
}

if (args['--docs']) {
  utils.showDocs()
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
    {
      type: 'select',
      name: 'tours',
      message: chalk`{bold.yellow Add in-app tours:}`,
      choices: [
        { title: 'Yes', description: 'Yes', value: true },
        { title: 'No', description: 'No', value: false },
      ],
    },
    {
      type: 'text',
      name: 'primary',
      message: chalk`{bold.yellow Primary color (empty for default):}`,
    },
  ]);

  if (!project.projectname) return;
  const projectName = project.projectname;
  const titlebar = project.titlebar;
  const tray = project.tray;
  const tours = project.tours;
  const primary = project.primary;
  
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

  const img2ico = await prompts([
    {
      type: 'select',
      name: 'value',
      message: chalk`{bold.yellow Use custom icon.png:}`,
      choices: [
        { title: 'No', description: 'No', value: false },
        { title: 'Yes', description: 'Yes', value: true },
      ],
    },
  ]);

  const installNodeModules = await prompts([
    {
      type: 'select',
      name: 'value',
      message: chalk`{bold.yellow Install Node Modules:}`,
      choices: [
        { title: 'No', description: 'No just scaffold the app', value: false },
        { title: 'Yes', description: 'Yes (this will take time)', value: true },
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
    await utils.gitClone(repo, projectName, branch);
    fs.rmSync(path.join(cwd, projectName, '.git'), {
      recursive: true,
      force: true,
    });
    spinner.clear();
    spinner.create(chalk`{bold.yellow Configuring App...}`);
    const configured = await utils.replaceStrings(projectName, titlebar, tray, tours, primary);
    if (configured) {
      spinner.clear();
    }    
    if (img2ico.value === true) {      
      const img2icoConfirm = await prompts([
        {
          type: 'select',
          name: 'value',
          message: chalk`{bold.yellow Place squared ${chalk`{cyan icon.png}`} in ${chalk`{cyan ./${projectName}}`}:}`,
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
        await utils.handleIcon(projectName)
      }
    }
    if (installNodeModules.value) {
      const pm = await utils.pm()
      const cmd = pm === 'yarn' ? 'yarn' : 'npm install';
      
      spinner.create(chalk`{bold.yellow Installing Node Modules (grab a coffee)...}`);
      
      const util = require('util');
      const exec = util.promisify(cp.exec);
      await exec(`cd ${path.join(cwd, projectName)} && ${cmd}`) 
      
      spinner.clear();
    }    
    console.log(chalk`
    {green DONE!}
    `)
    await utils.sleep(2000);
    utils.showDocs(projectName,titlebar,tray, tours, primary, img2ico.value, installNodeModules.value)     
  } catch (error) {
    spinner.fail(error);
    process.exit(error);
  }
}

init();