const path = require('path');
const readline = require('readline');
const fs = require('fs-extra');
const homeDir = require('os').homedir();
const chalk = require('chalk');

const workDir = path.join(homeDir, '.condiments');
const filesDir = path.join(workDir, 'files');
const scriptsDir = path.join(workDir, 'scripts');
const dbPath = path.join(workDir, 'db.json');

const initializeWorkDirectory = () => {
  fs.ensureDir(workDir).then(() => {
    fs.emptyDir(workDir).then(() => {
      fs.writeFile(dbPath, '{ "files": [], "scripts": [] }');
      fs.ensureDir(filesDir).then(() => {
        fs.emptyDir(filesDir);
      });
      fs.ensureDir(scriptsDir).then(() => {
        fs.emptyDir(scriptsDir);
      });
    });
  });
  console.log(`${chalk.green('Condiments was initialized.')}`);
};

const initialize = {
  command: 'init',
  description: 'Initialize a data directory for Condiments.',
  action: options => {
    fs.pathExists(workDir, (error, exists) => {
      if (error) {
        console.log(`Error: ${error}`);
        return;
      }
      if (exists && !options.force) {
        console.log(`${chalk.redBright('Condiments has already been initialized.')}`);
        return;
      }
      if (options.force) {
        console.log('Force initialization will delete all stored files and scripts.');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question('Are you sure? [y/N]', answer => {
          if (answer !== 'y') {
            console.log('Force initialization stopped.');
            rl.close();
            return;
          }
          initializeWorkDirectory();
          rl.close();
        });
      } else {
        initializeWorkDirectory();
      }
    });
  },
  options: {
    force: {
      syntax: '-f, --force',
      description: 'empty the work directory and reset all the data.'
    }
  }
};

module.exports = initialize;
