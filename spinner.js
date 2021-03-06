#!/usr/bin/env node

const ora = require('ora');
const chalk = require('chalk');

const cache = {};
const isTTY = process.env.CI ? false : process.stdout.isTTY;

function create(text) {
  if (!isTTY) {
    console.log(chalk`{cyan [create-vitron]} ${text}`);
    return;
  }

  const { spinner } = cache;
  if (spinner) {
    spinner.succeed();
    delete cache.spinner;
  }

  cache.spinner = ora({
    text,
    color: 'red',
  }).start();
}

function clear(message, isError) {
  if (!isTTY) {
    console.log(chalk`{cyan [create-vitron]} ${message}`);
    return;
  }

  const { spinner } = cache;
  if (spinner) {
    if (isError) {
      spinner.fail()
     } else {
      // spinner.stopAndPersist({symbol: '\xE2\x9C\x94'}); 
      spinner.succeed(); 
    };
    delete cache.spinner;
    // console.log('');
  }

  // const prefix = isError ? chalk.red('Error!') : chalk.green('Done!');
  // console.log(`${prefix} ${message}`);
}

function fail(message) {
  clear(message, true);
  process.exit(1);
}

module.exports.create = create;
module.exports.clear = clear;
module.exports.fail = fail;