#!/usr/bin/env node

import {addPackage, removePackage, listPackages} from './fetch.js';
//export default tmp;

const program = require('commander');

program
  .version('0.0.1')
  .command('add <package_name...>')
  .description('Add Package to mix.ex')
  .option('-O','override: true')
  .option('-D','only: :dev')
  .option('-P','only: :prod')
  .action(addPackage);

program
  .command('remove <package_name...>')
  .action(removePackage);

  program
    .command('list')
    .action(listPackages);

 program.parse(process.argv);
