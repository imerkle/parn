#!/usr/bin/env node

import {addPackage, removePackage} from './fetch.js';
import chalk from 'chalk';
//export default tmp;

const program = require('commander');
const addPackageX = (package_name, opts) => {
   addPackage(package_name, opts);
}
const removePackageX = (package_name) => {
  removePackage(package_name);
}

program
  .version('0.0.1')
  .command('add <package_name...>')
  .description('Add Package to mix.ex')
  .option('-O','override: true')
  .option('-D','only: :dev')
  .option('-P','only: :prod')
  .action(addPackageX);

program
  .command('remove <package_name...>')
  .action(removePackageX);

 program.parse(process.argv);
