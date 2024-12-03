const fs = require('fs')
const cp = require('child_process')
const replace = require('replace-in-file')
const path = require('path')
const chalk = require('chalk')
const cwd = process.cwd()

function showHelp() {
  console.clear()
  console.log(chalk`{bold.yellow Create Vitron (Electron + Vite)} {grey by Blade}
      
      {bold USAGE}
        {bold $} {cyan create-vitron} --help
        {bold $} {cyan create-vitron} --version
        {bold $} {cyan create-vitron}
  
      {bold OPTIONS}
        --help,     -h                      shows this help message
        --version,  -v                      displays the current version of create-vitron
    `)
}

function showDocs(projectName, ptitlebar, ptray, ptours, pprimary, picon, installNodeModules) {
  const name = projectName || 'Vitron'
  const titlebar = ptitlebar === true ? 'custom' : 'default'
  const icon = picon === true ? 'custom' : 'default'
  const tray = ptray === true ? 'yes' : 'no'
  const tours = ptours ? 'yes' : 'no'
  const primary = pprimary === '' ? 'default' : pprimary
  console.clear()
  console.log(chalk`{grey
    ┌───────────────────────────────────────┐
    │           {bold.red Welcome to Vitron}           │  
    |  {dim Electron + Vite + React + Typescript} |
    ├───────────────────────────────────────┤
    |  Name:      {bold.yellow ${name}}${spaces(26, name)}|
    |  Tray:      {bold.yellow ${tray}}${spaces(26, tray)}|
    |  Icon:      {bold.yellow ${icon}}${spaces(26, icon)}|
    |  Titlebar:  {bold.yellow ${titlebar}}${spaces(26, titlebar)}|
    |  Tours:     {bold.yellow ${tours}}${spaces(26, tours)}|
    |  Color:     {bold.yellow ${primary}}${spaces(26, primary)}|
    ├─────────┬──────────────┬──────────────┤
    │         │     APP      │     WEB      │
    ├─────────┼──────────────┼──────────────┤
    │  dev    │  {bold.yellow yarn start}  │  {bold.yellow yarn build}  │
    │  build  │  {bold.yellow yarn dev}    │  {bold.yellow yarn dist}   │
    └─────────┴──────────────┴──────────────┘
                    {dim.grey by Blade}
  
    To get started run:
  
    {bold.yellow cd ${name}}
    ${
      !installNodeModules
        ? chalk`{bold.yellow yarn
    yarn dev}`
        : chalk`{bold.yellow yarn dev}`
    }}`)
}

function replaceStrings(name, titlebar, tray, tours, primary) {
  return new Promise((resolve, reject) => {
    const options = [
      {
        files: [
          `${name}/electron-builder.js`,
          `${name}/electron-builder.yml`,
          `${name}/package.json`,
          `${name}/.github/workflows/release.yml`,
          `${name}/packages/main/index.ts`,
          `${name}/packages/renderer/index.html`,
          `${name}/src/renderer/index.html`,
          `${name}/src/renderer/src/store/useStore.ts`
        ],
        from: /Vitron/g,
        to: name
      },
      {
        files: [
          `${name}/electron-builder.js`,
          `${name}/electron-builder.yml`,
          `${name}/package.json`,
          `${name}/.github/workflows/release.yml`,
          `${name}/packages/main/index.ts`,
          `${name}/packages/renderer/index.html`,
          `${name}/src/renderer/index.html`,
          `${name}/src/renderer/src/store/useStore.ts`
        ],
        from: /vitron/g,
        to: name.toLowerCase()
      },
      {
        files: `${name}/package.json`,
        from: /"name": "vitron"/g,
        to: `"name": "${name.toLowerCase()}"`
      },
      {
        files: `${name}/package.json`,
        from: /"version": "\d.\d.\d"/g,
        to: `"version": "0.0.1"`
      },
      {
        files: `${name}/package.json`,
        from: /"description": "(.*?)"/g,
        to: `"description": "${name} 0.0.1 - supercharged with Vitron (by Blade)"`
      },
      {
        files: `${name}/electron-builder.js`,
        from: /com\.vitron\.app/g,
        to: `com.${name.toLowerCase()}.app`
      },
      {
        files: `${name}/electron-builder.yml`,
        from: /com\.electron\.app/g,
        to: `com.${name.toLowerCase()}.app`
      },
      {
        files: `${name}/electron-builder.yml`,
        from: /executableName: vitron/g,
        to: `executableName: ${name.toLowerCase()}`
      },
      {
        files: `${name}/src/renderer/index.html`,
        from: /<title>Vitron<\/title>/g,
        to: `<title>${name}</title>`
      },
      {
        files: `${name}/src/renderer/src/store/useStore.ts`,
        from: /name: 'vitron-storage'/g,
        to: `name: '${name.toLowerCase()}-storage'`
      },
      {
        files: `${name}/src/main/index.ts`,
        from: /title: 'Vitron'/g,
        to: `title: '${name}'`
      },
      {
        files: `${name}/src/main/index.ts`,
        from: /const NOTIFICATION_TITLE = 'Vitron - by Blade'/g,
        to: `const NOTIFICATION_TITLE = '${name} - by Blade'`
      },
      {
        files: `${name}/src/main/index.ts`,
        from: /tray\.setToolTip\('Vitron by Blade'\)/g,
        to: `tray.setToolTip('${name} by Blade')`
      },
      {
        files: `${name}/src/main/index.ts`,
        from: /label: 'Restart Vitron'/g,
        to: `label: 'Restart ${name}'`
      }
    ]

    if (!titlebar) {
      options.push({
        files: `${name}/package.json`,
        from: /"VITRON_CUSTOM_TITLEBAR": true/g,
        to: `"VITRON_CUSTOM_TITLEBAR": false`
      })
    }
    if (!tray) {
      options.push({
        files: `${name}/package.json`,
        from: /"VITRON_TRAY": true/g,
        to: `"VITRON_TRAY": false`
      })
    }
    if (!tours) {
      options.push({
        files: `${name}/package.json`,
        from: /"VITRON_TOURS": true/g,
        to: `"VITRON_TOURS": false`
      })
    }
    if (primary !== '') {
      options.push({
        files: `${name}/package.json`,
        from: /"VITRON_PRIMARY_COLOR": "default"/g,
        to: `"VITRON_PRIMARY_COLOR": "${primary}"`
      })
    }

    for (let index = 0; index < options.length; index++) {
      try {
        const results = replace.sync(options[index])
        if (!results) return
        resolve(true)
      } catch (error) {
        console.error('Error occurred:', error)
        reject(error)
      }
    }
  })
}

function handleIcon(name) {
  const pngToIco = require('png-to-ico')
  const png2icons = require('png2icons')
  const input = fs.readFileSync(`${name}/icon.png`)
  return new Promise((resolve, reject) => {
    pngToIco(`${name}/icon.png`)
      .then((buf) => {
        fs.writeFileSync(`${name}/resources/icon.ico`, buf)
        fs.writeFileSync(`${name}/resources/installerIcon.ico`, buf)
        fs.writeFileSync(`${name}/resources/uninstallerIcon.ico`, buf)
        fs.writeFileSync(`${name}/src/renderer/src/assets/icon.png`, buf)
        fs.writeFileSync(`${name}/src/renderer/src/assets/electron.png`, buf)
        fs.rmSync(`${name}/resources/icon.icns`, { recursive: true, force: true })
        const output = png2icons.createICNS(input, png2icons.BILINEAR, 0)
        if (output) {
          fs.writeFileSync(`${name}/resources/icon.icns`, output)
        }
        resize(path.join(name, 'icon.png'), `${name}/resources/icon.png`)
        resize(path.join(name, 'icon.png'), `${name}/packages/renderer/src/assets/icon.png`)
        fs.rmSync(path.join(cwd, name, 'icon.png'), { recursive: true, force: true })
        resolve()
      })
      .catch((error) => {
        console.log(error)
        reject()
      })
  })
}

async function resize(source, target, size = 256) {
  const jimp = require('jimp')
  const image = await jimp.read(source)
  image.resize(size, jimp.AUTO)
  await image.writeAsync(target || source)
  return true
}

function gitClone(repo, projectName, branch) {
  return new Promise((resolve, reject) => {
    const _branch = branch ? ['-b', branch] : []
    cp.spawn('git', ['clone', ..._branch, repo, projectName, '--depth', '1'], {
      stdio: 'ignore'
    }).on('close', (code, signal) => {
      if (code) {
        reject(code)
        return
      }
      resolve(signal)
    })
  })
}

async function pm() {
  const { promisify } = require('util')
  const { exec: defaultExec } = require('child_process')
  let pm = 'yarn'
  const exec = promisify(defaultExec)
  try {
    await exec(`${pm} -v`, { cwd })
  } catch (_) {
    pm = 'npm'
    try {
      await exec(`${pm} -v`, { cwd })
    } catch (_) {
      pm = undefined
    }
  }
  if (pm === undefined) {
    console.log(chalk.yellow('No available package manager! (`npm` or `yarn` is required)'))
    process.exit(1)
  }
  return pm
}

function spaces(max, str) {
  return Array(max - str.length)
    .fill('\xa0')
    .join('')
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

module.exports.showHelp = showHelp
module.exports.showDocs = showDocs
module.exports.replaceStrings = replaceStrings
module.exports.handleIcon = handleIcon
module.exports.resize = resize
module.exports.gitClone = gitClone
module.exports.pm = pm
module.exports.spaces = spaces
module.exports.sleep = sleep
