const fs = require('fs-extra');
const path = require('path');
const homeDir = require('os').homedir();
const chalk = require('chalk');

const workDir = path.join(homeDir, '.condiments');

const test = {
  command: 'test',
  description: 'Just a test.',
  action: () => {
    console.log(`${chalk.blue('Tested')} at ${new Date()}`);
    // console.log(`${chalk.bgBlackBright(`workDir: ${workDir}`)}`);
    fs.pathExists(workDir, (error, exists) => {
      if (error) {
        console.log(`Error: ${error}`);
        return;
      }
      if (!exists) {
        // console.log(`workDir exists: ${exists}`);
        console.log(`${chalk.redBright('Condiments has not been initialized.')}`);
        return;
      }
      // console.log(`workDir exists: ${exists}`);
      console.log(`${chalk.greenBright('Condiments has already been initialized.')}`);
    });
  }
};

module.exports = test;
