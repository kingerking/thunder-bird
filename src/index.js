#!/usr/bin/env node
import commander from 'commander';
import pkg from '../package.json';
import fs from 'fs';
import path from 'path';
import * as commands from './commands';
import { forEach, values } from 'lodash';

const DEFAULT_CONFIG = {
    /**
     * settings for this command line instance on someones computer.
     */
    settings: {},
    /**
     * Peoples symbol links will be keys and values will be the url to their file to run with node.
     */ 
    resolve: {}
}

export const storageFileURL = path.join(__dirname, '.thunder_store');

const createStorageFile = () => { 
    console.log("creating config file.");    
    fs.writeFileSync(storageFileURL, JSON.stringify(DEFAULT_CONFIG))
}

// this will check for a configuration file, if non exists this will create one.
const initProgram = () => {
    if (!fs.existsSync(storageFileURL))
        createStorageFile();
}

const program = commander.version(pkg.version);

// iterate through all command bodies so they can be registered with commander.
forEach(values(commands), commandFunctionBody => commandFunctionBody(program));



initProgram();
program.parse(process.argv);
