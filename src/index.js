#!/usr/bin/env node
import commander from 'commander';
import pkg from '../package.json';
import fs from 'fs';
import path from 'path';
import { loadStore, LOG_HELPER, executeCommand, defaultCommand, log } from './helpers';
import * as commands from './commands';
import { forEach, values, keys } from 'lodash';
import chalk from 'chalk';
import { asTree } from 'treeify'

const DEFAULT_CONFIG = {
    /**
     * settings for this command line instance on someones computer.
     */
    settings: {
        "!default": {
            "!execution": "node"
        },
        "!execution": ""
    },
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
    const { resolve: links } = loadStore(false);
    if (!links) return console.log(LOG_HELPER.ERR(
        `Failed to load store.`
    ));
    forEach(keys(links), key => {
        const entity = links[key];
        if (!entity) return console.log(LOG_HELPER.ERR(
            `Failed to find entity with name: ${LOG_HELPER.INLINE_STAND_OUT(key)}`
        ));
        program.command(`${key} [params...]`, null, { noHelp: true }).
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
buildUserCommandsIntoFunctions(program);
// iterate through all command bodies so they can be registered with commander.
forEach(values(commands),
    commandFunctionBody => commandFunctionBody(program));
program.on('--help', () => {
    const additionalHelp = {
        "Custom Command Descriptions": {
            "Creating Descriptions": LOG_HELPER.INLINE_STAND_OUT(
                `please create a package.json in the "SAME" directory as your script, make sure that your package.json has a 'description' key to apply your commands description to the 'tb list' output.`
            )
        }
    }
    console.log(LOG_HELPER.INFO(
        `Displaying documentation on thunder-bird`,
        asTree(additionalHelp, true)
    ));
});

// program.parse(process.argv);
// no command passed. Run the default command.
if (!process.argv.slice(2).length) 
{
    log.common(LOG_HELPER.INFO("Running default command"))
    defaultCommand();
}
else
    program.parse(process.argv);



