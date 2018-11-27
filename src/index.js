import commander from 'commander';
import pkg from '../package.json';

const program = commander.version(pkg.version);

program.parse(process.argv);