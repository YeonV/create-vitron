#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const prompts = require('prompts');
const arg = require('arg');
const chalk = require('chalk');

const cwd = process.cwd();

const args = arg({
  '--help': Boolean,
  '--version': Boolean,
  '--example': String,
  '-h': '--help',
  '-v': '--version',
  '-e': '--example',
});

if (args['--version']) {
  const pkg = require(path.join(__dirname, 'package.json'));
  console.log(`Vitron v${pkg.version}`);
  process.exit(0);
}

if (args['--help']) {
  console.clear()
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

async function init() {
  console.clear()
  console.log(chalk`
    {bold.red Create Vitron (Electron + Vite)} {dim.grey by Blade}
  `)

  const project = await prompts([{
    type: 'text',
    name: 'projectname',
    message: chalk`{bold.yellow Name:}`
  },{
    type: 'select',
    name: 'titlebar',
    message: chalk`{bold.yellow Titlebar:}`,
    choices: [
      { title: 'Yes', description: 'Use Custom Titlebar', value: true },
      { title: 'No', description: 'Use Default Titlebar', value: false },
    ],
    initial: 0
  },{
    type: 'select',
    name: 'titlebar',
    message: chalk`{bold.yellow Tray:}`,
    choices: [
      { title: 'Yes', description: 'Use SystemTray', value: true },
      { title: 'No', description: 'No SystemTray', value: false },
    ],
    initial: 0
  },
  // {
  //     type: 'select',
  //     name: 'value',
  //     message: chalk`{bold.yellow Project template:}`,
  //     choices: [
  //       {
  //         title: 'React',
  //         value: { repoName: 'vitron' },
  //       },
  //     ],
  //   }
  ])

  if (!project.projectname) return;
  const projectName = project.projectname;

  
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
    }
  ]);

  if (!template.value) return;

  const auto = await prompts([
    {
      type: 'select',
      name: 'start',
      message: chalk`{bold.yellow Install Node Modules:}`,
      choices: [
        { title: 'Yes', description: 'Yes (this will take time)', value: true },
        { title: 'No', description: 'No just scaffold the app', value: false },
      ],
    }
  ]);

  const { repoName, branch } = template.value;
  const repo = `https://github.com/yeonv/${repoName}`;
  const spinner = require('./spinner');
  try {

    if (fs.existsSync(projectName) && fs.statSync(projectName).isDirectory()) {
      console.error(`🚧 Directory "${projectName}" already exists.`);
      process.exit(1);
    }
    let cmd = (await pm() === 'yarn') ? 'yarn && yarn dev' : 'npm install && npm run dev';
    spinner.create(chalk`{bold.yellow Downloading and extracting...}`);
    await gitClone(repo, projectName, branch)
    
    
    if (!auto.start) {
      spinner.clear(`Run \`${cmd}\` inside of "${projectName}" to start the app`);
    }    
    fs.rmSync(path.join(cwd, projectName, '.git'), { recursive: true, force: true });
    if (auto.start) {
      cmd = (await pm() === 'yarn') ? 'yarn' : 'npm install';
      spinner.create(chalk`{bold.yellow Installing Node Modules (grab a coffee)...}`);
      cp.execSync(
        `cd ${path.join(cwd, projectName)} && ${cmd}`,
        { stdio: 'ignore' },
      )
      cmd = (await pm() === 'yarn') ? 'yarn dev' : 'npm run dev';
      spinner.clear(chalk`{bold.yellow Run:
cd ${projectName}
${cmd}
      }`);
    }
  } catch (error) {
    spinner.fail(error);
    process.exit(error);
  }
}

function gitClone(repo, projectName, branch) {
  return new Promise((resolve, reject) => {
    const _branch = branch ? ['-b', branch] : [];
    cp.spawn(
      'git',
      ['clone', ..._branch, repo, projectName, '--depth', '1'],
      { stdio: 'ignore' },
    )
      .on('close', (code, signal) => {
        if (code) {
          reject(code);
          return;
        }
        resolve(signal);
      });
  });
}

init();


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
    console.log(chalk.yellow('No available package manager! (`npm` or `yarn` is required)'));
    process.exit(1);
  }

  return pm;
}