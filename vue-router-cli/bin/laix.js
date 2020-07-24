#!/usr/bin/env node

const program = require('commander');

program.version(require('../package.json').version);

program
  .command('init <name>')
  .description('init project')
  .action(require('../lib/init'));

program
  .command('refresh')
  .description('refresh')
  .action(require('../lib/refresh'));

program
  .command('rebuild')
  .description('rebuild')
  .action(require('../lib/rebuild'));

program.parse(process.argv);
