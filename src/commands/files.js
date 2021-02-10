const path = require('path');
const fs = require('fs-extra');
const readlineSync = require('readline-sync');
const { nanoid } = require('nanoid');
const homeDir = require('os').homedir();
const chalk = require('chalk');
// lowdb
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const workDir = path.join(homeDir, '.condiments');
const filesDir = path.join(workDir, 'files');
const dbPath = path.join(workDir, 'db.json');
const aliasRegex = new RegExp('^[\\w\\.\\-\\@]{1,255}$');

const save = {
  command: 'save',
  arguments: '<path>',
  description: 'Save a file or folder to condiments library',
  action: (sourcePath, options) => {
    fs.pathExists(workDir, error => {
      if (error) {
        console.log(`Error: ${error}`);
        return;
      }

      // console.log(`file or folder path: ${sourcePath}`);

      // Check path
      if (!fs.pathExistsSync(sourcePath)) {
        console.log('File or folder is not exist. Check your path.');
        return;
      }

      const sourceOriginalName = path.basename(sourcePath);

      const targetId = nanoid();
      const isDirectory = fs.lstatSync(sourcePath).isDirectory();
      let targetAlias = options.alias === undefined || options.alias === '' || options.alias === true ? sourceOriginalName : options.alias;

      // Set alias.
      if (options.alias !== undefined && options.alias.length > 0) {
        // console.log(`alias: ${targetAlias}`);
        if (!targetAlias.match(aliasRegex)) {
          console.log('Illegal alias name.');
          process.exit();
        }
      } else {
        let answer = readlineSync.question(`Specify an alias for the file or folder: (${targetAlias}) `);
        if (answer === '' && targetAlias.match(aliasRegex)) {
          answer = targetAlias;
        }
        while (!answer.match(aliasRegex)) {
          console.log('Illegal alias name.');
          answer = readlineSync.question(`Specify an alias for the file or folder: (${targetAlias}) `);
        }
        targetAlias = answer;
      }

      // Connect the db.
      const adapter = new FileSync(dbPath);
      const db = low(adapter);

      // Check alias in db.
      const sameAlias = db.get('files')
        .countBy({ alias: targetAlias }).value();

      if (sameAlias.true > 0 && options.force === undefined) {
        console.log('Same alias exits.');
        return;
      }

      if (sameAlias.true > 0 && options.force) {
        const overwriteAnswer = readlineSync.question('Same alias exits. Overwrite it? (y/N) ');
        if (overwriteAnswer !== 'Y' && overwriteAnswer !== 'y') {
          console.log('Canceled');
          return;
        }

        // Remove old from library.
        const oldId = db.get('files').find({ alias: targetAlias }).value().id;
        const oldFilePath = path.join(filesDir, oldId);
        fs.removeSync(oldFilePath);

        // Remove old from db.
        db.get('files').remove({ alias: targetAlias }).write();
      }

      // Save to db.
      const target = {
        id: targetId,
        alias: targetAlias,
        type: isDirectory ? 'folder' : 'file',
        source: path.resolve(sourcePath)
      };
      db.get('files')
        .push(target)
        .write();

      // Save to work folder
      const targetPath = path.join(filesDir, targetId);
      fs.copySync(sourcePath, targetPath);
      console.log(`${chalk.greenBright(`"${sourcePath} (${targetAlias})" saved.`)}`);
    });
  },
  options: {
    force: {
      syntax: '-f, --force',
      description: 'Overwrite existed file or folder with same name.'
    },
    alias: {
      syntax: '-a, --alias [name]',
      description: 'Set alias for saved file or folder.'
    }
  }
};

const load = {
  command: 'load',
  arguments: '<alias>',
  description: 'Load file or folder from library by its alias.',
  action: (requestAlias, options) => {
    fs.pathExists(workDir, error => {
      if (error) {
        console.log(`Error: ${error}`);
        return;
      }

      // console.log(options);

      // Check directory
      if (options.dist !== undefined && !fs.lstatSync(options.dist).isDirectory()) {
        console.log('Illegal path.');
        return;
      }

      // Check alias by regex.
      if (!requestAlias.match(aliasRegex)) {
        console.log('Illegal alias.');
        return;
      }

      // Check file
      const adapter = new FileSync(dbPath);
      const db = low(adapter);
      const fileCount = db.get('files').countBy({ alias: requestAlias }).value();
      if (fileCount.true === undefined || fileCount.true < 1) {
        console.log('No file or folder use this alias.');
        return;
      }

      // Get file data.
      const file = db.get('files').find({ alias: requestAlias }).value();
      const targetPath = options.dist !== undefined ? options.dist : './';
      const fileName = path.basename(file.source);
      const distTarget = path.join(targetPath, fileName);
      const libSource = path.join(filesDir, file.id);

      // Check if target exists.
      if (fs.pathExistsSync(distTarget)) {
        if (!options.force) {
          console.log('File or folder exists.');
          process.exit();
        }
        const answer = readlineSync.question('File or folder exists. Overwrite it? (y/N) ');
        if (answer !== 'Y' && answer !== 'y') {
          console.log('Canceled');
          process.exit();
        }
      }

      // Load
      fs.copySync(libSource, distTarget);

      console.log(`${chalk.greenBright(`"${fileName} (${requestAlias})" loaded to: ${targetPath}`)}`);
    });
  },
  options: {
    force: {
      syntax: '-f, --force',
      description: 'Overwrite existed file or folder with same name in dist directory.'
    },
    dist: {
      syntax: '-d, --dist [path]',
      description: 'Load request file or folder to a specified path.'
    }
  }
};

const filesHub = {
  command: 'files',
  description: 'Files library manager.',
  listFiles: {
    command: 'ls',
    description: 'List condiments Files library',
    action: () => {
      console.log('\nSaved Files: \n-----------------');
      console.log(`No.\t${'Id'.padEnd(22)}\t${'Alias'.padEnd(16)}\t${'Type'.padEnd(8)}\tSource`);

      // Connect the db.
      const adapter = new FileSync(dbPath);
      const db = low(adapter);

      const files = db.get('files').value();
      files.forEach((file, index) => {
        console.log(`${index + 1}\t${file.id.padEnd(22)}\t${file.alias.padEnd(16)}\t${file.type.padEnd(8)}\t${file.source}`);
      });
      console.log('\n');
    }
  },
  removeFiles: {
    command: 'rm',
    arguments: '<alias>',
    description: 'Remove file or folder by alias',
    action: requestAlias => {
      const answer = readlineSync.question(`Remove ${requestAlias}? (y/N) `);

      if (answer !== 'Y' && answer !== 'y') {
        console.log('Canceled');
        return;
      }

      // Connect the db.
      const adapter = new FileSync(dbPath);
      const db = low(adapter);

      // Get file name (id).
      const targetId = db.get('files').find({ alias: requestAlias }).value().id;

      // Remove from database.
      db.get('files').remove({ alias: requestAlias }).write();

      // Remove from work folder.
      const targetPath = path.join(filesDir, targetId);
      fs.removeSync(targetPath);

      console.log(`${requestAlias} has been removed.`);
    }
  },
  removeAllFiles: {
    command: 'clean',
    description: 'Remove all stored files.',
    action: () => {
      const answer = readlineSync.question('CLEAN ALL FILES? (y/N) ');

      if (answer !== 'Y' && answer !== 'y') {
        console.log('Canceled');
        return;
      }

      // Connect the db.
      const adapter = new FileSync(dbPath);
      const db = low(adapter);

      // Remove all files.
      db.get('files').remove({}).write();
      fs.emptyDir(filesDir);

      console.log('All files have been cleaned.');
    }
  }
};

module.exports = {
  save,
  load,
  filesHub
};
