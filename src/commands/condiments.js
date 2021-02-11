#!/usr/bin/env node

const { Command } = require('commander');
const packageJson = require('../../package.json');
const test = require('./test');
const initialize = require('./initialize');
const { save, load, filesHub } = require('./files');
const { script, run, scriptsHub } = require('./scripts');

if (process.argv.length === 0) {
  console.log(`CLI Tools Condiments v${packageJson.version}`);
}

const program = new Command();

program.version(packageJson.version, '-v, --version', 'Show the version of Condiments.');

// Test
program
  .command(test.command)
  .description(test.description)
  .action(test.action);

// Initialize
program
  .command(initialize.command)
  .description(initialize.description)
  .option(initialize.options.force.syntax, initialize.options.force.description)
  .action(options => initialize.action(options));

// Save file or folder
program
  .command(save.command)
  .description(save.description)
  .arguments(save.arguments)
  .option(save.options.force.syntax, save.options.force.description)
  .option(save.options.alias.syntax, save.options.alias.description)
  .action((targetPath, options) => save.action(targetPath, options));

// Load file or folder
program
  .command(load.command)
  .description(load.description)
  .arguments(load.arguments)
  .option(load.options.force.syntax, load.options.force.description)
  .option(load.options.dist.syntax, load.options.dist.description)
  .option(load.options.bare.syntax, load.options.bare.description)
  .action((requestAlias, options) => load.action(requestAlias, options));

// List all stored files
const listFiles = new Command()
  .command(filesHub.listFiles.command)
  .description(filesHub.listFiles.description)
  .action(filesHub.listFiles.action);

// Remove files by alias
const removeFiles = new Command()
  .command(filesHub.removeFiles.command)
  .description(filesHub.removeFiles.description)
  .arguments(filesHub.removeFiles.arguments)
  .action(requestAlias => filesHub.removeFiles.action(requestAlias));

// Remove all files (clean)
const removeAllFiles = new Command()
  .command(filesHub.removeAllFiles.command)
  .description(filesHub.removeAllFiles.description)
  .action(filesHub.removeAllFiles.action);

// Files commands
program
  .command(filesHub.command)
  .description(filesHub.description)
  .addCommand(listFiles)
  .addCommand(removeFiles)
  .addCommand(removeAllFiles);

// Save script snippet or file
program
  .command(script.command)
  .description(script.description)
  .arguments(script.arguments)
  .option(script.options.force.syntax, script.options.force.description)
  .option(script.options.alias.syntax, script.options.alias.description)
  .action((content, options) => script.action(content, options));

// Run script snippet or file
program
  .command(run.command)
  .description(run.description)
  .arguments(run.arguments)
  // .option(run.options.alias.syntax, run.options.alias.description)
  .action((requestAlias, options) => run.action(requestAlias, options));

// List all stored files
const listScripts = new Command()
  .command(scriptsHub.listScripts.command)
  .description(scriptsHub.listScripts.description)
  .action(scriptsHub.listScripts.action);

// Remove script by alias
const removeScript = new Command()
  .command(scriptsHub.removeScript.command)
  .description(scriptsHub.removeScript.description)
  .arguments(scriptsHub.removeScript.arguments)
  .action(requestAlias => scriptsHub.removeScript.action(requestAlias));

// Remove all scripts (clean)
const removeAllScripts = new Command()
  .command(scriptsHub.removeAllScripts.command)
  .description(scriptsHub.removeAllScripts.description)
  .action(scriptsHub.removeAllScripts.action);

// Scripts commands
program
  .command(scriptsHub.command)
  .description(scriptsHub.description)
  .addCommand(listScripts)
  .addCommand(removeScript)
  .addCommand(removeAllScripts);

program.parse(process.argv);
