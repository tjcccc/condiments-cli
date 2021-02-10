const path = require('path');
const { exec } = require('child_process');
const fs = require('fs-extra');
const readlineSync = require('readline-sync');
const { nanoid } = require('nanoid');
const homeDir = require('os').homedir();
const chalk = require('chalk');
// lowdb
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
// const { basename } = require('path');

const workDir = path.join(homeDir, '.condiments');
const scriptsDir = path.join(workDir, 'scripts');
const dbPath = path.join(workDir, 'db.json');
const aliasRegex = new RegExp('^[\\w\\.\\-\\@]{1,255}$');

const makeScriptContent = snipper => {
  let fileContent = '';
  if (process.platform === 'win32') {
    fileContent = snipper;
  } else {
    fileContent = `#!/bin/bash\n\n${snipper}`;
  }
  return fileContent;
};

const script = {
  command: 'script',
  arguments: '<content>',
  description: 'Save script code snippet or an executable script file to condiments library.\nUse {} or "" to wrap up code snippet, use relative path for script file.\nExample: \n  cond script { ls -a } -a list\n  cond script ./a.sh -a mysh',
  action: (content, options) => {
    fs.pathExists(workDir, error => {
      if (error) {
        console.log(`Error: ${error}`);
        return;
      }

      // console.log(content);

      // console.log(fs.pathExistsSync(content));

      // return;

      if (fs.pathExistsSync(content) && fs.lstatSync(content).isDirectory()) {
        console.error('Error: directory is not script.');
        return;
      }

      // Script code snippet of script file.
      const isFile = fs.pathExistsSync(content);

      if (!isFile && options.alias === undefined) {
        console.error('Error: Snipper must have an alias.');
        return;
      }

      // Set script data
      const targetId = nanoid();
      const snippetContent = isFile ? '(...)' : content.trim();
      const sourceOriginalName = isFile ? path.basename(content) : 'snippet';
      let targetAlias = options.alias === undefined || options.alias === '' || options.alias === true ? sourceOriginalName : options.alias;

      // Set alias.
      if (options.alias !== undefined && options.alias.length > 0) {
        // console.log(`alias: ${targetAlias}`);
        if (!targetAlias.match(aliasRegex)) {
          console.log('Illegal alias name.');
          process.exit();
        }
      } else {
        let answer = readlineSync.question(
          `Specify an alias for snippet or file: (${targetAlias}) `
        );
        if (answer === '' && targetAlias.match(aliasRegex)) {
          answer = targetAlias;
        }
        while (!answer.match(aliasRegex)) {
          console.log('Illegal alias name.');
          answer = readlineSync.question(
            `Specify an alias for snippet or file: (${targetAlias}) `
          );
        }
        targetAlias = answer;
      }

      // Connect the db.
      const adapter = new FileSync(dbPath);
      const db = low(adapter);

      // Check alias in db.
      const sameAlias = db
        .get('scripts')
        .countBy({ alias: targetAlias })
        .value();

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
        const oldId = db.get('scripts').find({ alias: targetAlias }).value().id;
        const oldScriptPath = path.join(scriptsDir, oldId);
        fs.removeSync(oldScriptPath);
        fs.removeSync(`${oldScriptPath}.ps1`);
        fs.removeSync(`${oldScriptPath}.sh`);

        // Remove old from db.
        db.get('scripts').remove({ alias: targetAlias }).write();
      }

      // Make a script object
      const target = {
        id: targetId,
        alias: targetAlias,
        type: isFile ? 'file' : 'snippet',
        source: isFile ? path.resolve(content) : `{ ${snippetContent.slice(0, 10)}${snippetContent.length > 9 ? '...' : ''} }`
      };

      // Save to db
      db.get('scripts').push(target).write();

      // Save to work folder
      if (isFile) {
        const targetPath = path.join(scriptsDir, targetId);
        fs.copySync(content, targetPath);
      } else {
        const fileName = targetId;
        const targetPath = path.join(scriptsDir, fileName);
        const fileContent = makeScriptContent(snippetContent);
        fs.writeFileSync(targetPath, fileContent);

        // Add executable permission.
        if (process.platform !== 'win32') {
          fs.chmodSync(targetPath, 0o775);
        }
      }

      console.log(`${chalk.greenBright(`Script '${targetAlias}' saved.`)}`);
    });
  },
  options: {
    force: {
      syntax: '-f, --force',
      description: 'Overwrite existed script with same name.'
    },
    alias: {
      syntax: '-a, --alias [name]',
      description: 'Set alias for saved script.'
    }
  }
};

const run = {
  command: 'run',
  arguments: '<alias>',
  description: 'Run saved script by its alias.',
  action: requestAlias => {
    fs.pathExists(workDir, error => {
      if (error) {
        console.log(`Error: ${error}`);
        return;
      }

      // console.log(options);

      // Check alias by regex.
      if (!requestAlias.match(aliasRegex)) {
        console.log('Illegal alias.');
        return;
      }

      // Check file
      const adapter = new FileSync(dbPath);
      const db = low(adapter);
      const fileCount = db
        .get('scripts')
        .countBy({ alias: requestAlias })
        .value();
      if (fileCount.true === undefined || fileCount.true < 1) {
        console.log('No script code snippet or script file use this alias.');
        return;
      }

      // Get script data.
      const requestScript = db.get('scripts').find({ alias: requestAlias }).value();
      const requestScriptPath = path.join(scriptsDir, requestScript.id);
      console.log(requestScriptPath);

      console.log(`${chalk.greenBright(`Run script: '${requestAlias}'`)}\n`);

      if (process.platform === 'win32') {
        if (fs.pathExistsSync(requestScriptPath)) {
          exec(`pwsh ${requestScriptPath}`, (runError, stdout, stderr) => {
            if (runError) {
              console.error(runError);
            }
            if (stderr) {
              console.error(stderr);
            }
            console.log(stdout);
          });
        }
        return;
      }
      if (fs.pathExistsSync(requestScriptPath)) {
        exec(requestScriptPath, (runError, stdout, stderr) => {
          if (runError) {
            console.error(runError);
          }
          if (stderr) {
            console.error(stderr);
          }
          console.log(stdout);
        });
      }

      // At Linux / Unix / macOS environment.
      if (fs.pathExistsSync(`${requestScriptPath}.sh`)) {
        exec(`${requestScriptPath}.sh`, (runError, stdout, stderr) => {
          if (runError) {
            console.error(runError);
          }
          if (stderr) {
            console.error(stderr);
          }
          console.log(stdout);
        });
      }
    });
  },
  options: {
    // alias: {
    //   syntax: '-a, --alias [name]',
    //   description: 'Set alias for saved script.'
    // }
  }
};

const scriptsHub = {
  command: 'scripts',
  description: 'Scripts library manager.',
  listScripts: {
    command: 'ls',
    description: 'List condiments Scripts library',
    action: () => {
      console.log('\nSaved Scripts: \n-----------------');
      console.table(`No.\t${'Id'.padEnd(22)}\t${'Alias'.padEnd(16)}\t${'Type'.padEnd(8)}\tSource`);

      // Connect the db.
      const adapter = new FileSync(dbPath);
      const db = low(adapter);

      const scripts = db.get('scripts').value();
      scripts.forEach((scriptData, index) => {
        console.log(`${index + 1}\t${scriptData.id.padEnd(22)}\t${scriptData.alias.padEnd(16)}\t${scriptData.type.padEnd(8)}\t${scriptData.source}`);
      });
      console.log('\n');
    }
  },
  removeScript: {
    command: 'rm',
    arguments: '<alias>',
    description: 'Remove script by alias',
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
      const targetPath = path.join(scriptsDir, targetId);
      fs.removeSync(targetPath);

      console.log(`${requestAlias} has been removed.`);
    }
  },
  removeAllScripts: {
    command: 'clean',
    description: 'Remove all stored scripts.',
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
      fs.emptyDir(scriptsDir);

      console.log('All files have been cleaned.');
    }
  }
};

module.exports = {
  script,
  run,
  scriptsHub
};
