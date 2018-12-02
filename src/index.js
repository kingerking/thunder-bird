#!/usr/bin/env node
import commander from 'commander';
import pkg from '../package.json';
import fs from 'fs';
import path from 'path';
import { loadStore, LOG_HELPER, executeCommand } from './helpers';
import * as commands from './commands';
import { forEach, values, keys } from 'lodash';
import chalk from 'chalk';

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
    fs.writeFileSync(storageFileURL, JSON.stringify(DEFAULT_CONFIG));
    console.log(LOG_HELPER.INFO_CUSTOM('TB Init', "Created: Store File", chalk.yellow(storageFileURL)));
}

/**
 * Will return command objects for all the registered .resolve[]'s in the storage file.
 * (much like yarn npm "scripts" commands)
 */
const buildUserCommandsIntoFunctions = program => {
    const { resolve: links } = loadStore();
    if (!links) return console.log(LOG_HELPER.ERR(
        `Failed to load store.`
    ));
    forEach(keys(links), key => {
        const entity = links[key];
        if (!entity) return console.log(LOG_HELPER.ERR(
            `Failed to find entity with name: ${LOG_HELPER.INLINE_STAND_OUT(key)}`
        ));
        program.command(`${key} [params...]`).
            action((params = [], cmd) => executeCommand(key, params, cmd));
    })
}

// this will check for a configuration file, if non exists this will create one.
const initProgram = () => {
    if (!fs.existsSync(storageFileURL))
        createStorageFile();
}

const program = commander.version(pkg.version);
initProgram();

// iterate through all command bodies so they can be registered with commander.
forEach(values(commands, buildUserCommandsIntoFunctions(program)),
    commandFunctionBody => commandFunctionBody(program));



program.parse(process.argv);
