#!/usr/bin/env node

const { Command } = require('commander');
const packageJson = require('../../package.json');
const test = require('./test');
const initialize = require('./initialize');
const { save, load, filesHub } = require('./files');

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
  .arguments(save.arguments)
  .description(save.description)
  .option(save.options.force.syntax, save.options.force.description)
  .option(save.options.alias.syntax, save.options.alias.description)
  .action((targetPath, options) => save.action(targetPath, options));

// Load file or folder
program
  .command(load.command)
  .arguments(load.arguments)
  .description(load.description)
  .option(load.options.force.syntax, load.options.force.description)
  .option(load.options.dist.syntax, load.options.dist.description)
  .action((requestAlias, options) => load.action(requestAlias, options));

// List all stored files
const listFiles = new Command()
  .command(filesHub.listFiles.command)
  .description(filesHub.listFiles.description)
  .action(filesHub.listFiles.action);

// Remove files by alias
const removeFiles = new Command()
  .command(filesHub.removeFiles.command)
  .arguments(filesHub.removeFiles.arguments)
  .description(filesHub.removeFiles.description)
  .action(requestAlias => filesHub.removeFiles.action(requestAlias));

// Remove all files (clean)
const removeAllFiles = new Command()
  .command(filesHub.removeAllFiles.command)
  .description(filesHub.removeAllFiles.description)
  .action(filesHub.removeAllFiles.action);

// Files command
program
  .command(filesHub.command)
  .description(filesHub.description)
  .addCommand(listFiles)
  .addCommand(removeFiles)
  .addCommand(removeAllFiles);

program.parse(process.argv);
