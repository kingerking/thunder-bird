
import { merge, values } from 'lodash';
import { storageFileURL } from './index';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import debug from 'debug';
import { asTree } from 'treeify';
import _ from 'lodash';

export const log = {
    common: debug('common'),
    internal_error: debug('internal_error'),
    common_large: debug('common_large')
};

/**
 * Will add a + so users know something is assoiated with a given log
 */
function replaceNewLineWithPlus(lineBuffer, plusArrowColorFunc = chalk.yellow) {
    const lines = lineBuffer.split('\n').map(element => element.replace('\n', ''));
    return lines.join(`\n  ${chalk.bold(chalk.yellow(plusArrowColorFunc("+")))}  `);
}

/**
 * Helper for logs.
 */
export const LOG_HELPER = {
    INFO_CUSTOM: (name, ...str) => `${chalk.bold(chalk.yellow(name))} ${chalk.gray(replaceNewLineWithPlus(str.join('\n')))}`,
    INFO: (...str) => `${chalk.bold(chalk.yellow("Info"))} ${chalk.gray(replaceNewLineWithPlus(str.join('\n')))}`,
    ERR: (...str) => `${chalk.bold(chalk.red('Error'))} ${chalk.gray(replaceNewLineWithPlus(str.join('\n'), chalk.red))}`,
    CMD: (...str) => `${chalk.bold(chalk.magenta('CMD'))} ${chalk.cyan(replaceNewLineWithPlus(str.join('\n')))}`,
    INLINE_CMD: (...str) => `${chalk.cyan(replaceNewLineWithPlus(str.join('\n')))}`,
    INLINE_STAND_OUT: (...str) => `${chalk.bold(chalk.magenta(replaceNewLineWithPlus(str.join('\n'))))}`
}


/**
 * Load the storage buffer.
 * (make sure to save after editting.)
 */
export function loadStore(doLog = true) {
    const storageObject = JSON.parse(fs.readFileSync(storageFileURL));
    if (!storageObject) throw new Error("Failed to resolve thunder-bird store file.");
    if(doLog) log.common_large(LOG_HELPER.INFO_CUSTOM('Store File',
        `Store Load`, ``,
        asTree(storageObject, true)
    ));
    return storageObject;
}


/**
 * Will make all the linked files executable.
 */
export function permissionLinks() {
    const { resolve } = loadStore(false);
    const fileLinks = values(resolve);
    let output = "";
    fileLinks.forEach(fileLink => {
        if (!exists(fileLink)) 
            return;
        child_process.exec(`chmod +x ${fileLink}`, (err, stdout, stderr) => output += (err || stdout || stderr));
    });
}

/**
 * Save a storage buffer.
 * @param {*} store 
 * @param {*} absolute 
 */
export function saveStore(store = {}, absolute = false, doLog = true) {
    if (!absolute) {
        var currentStore = loadStore(false);
        var newStore = merge(currentStore, store);
    } else if(absolute) var newStore = store;
    fs.writeFileSync(storageFileURL, JSON.stringify(newStore, null, 4));
    if(doLog) log.common_large(LOG_HELPER.INFO_CUSTOM('Store File', 'Store Load', asTree(newStore, true)));
    permissionLinks();
}

/**
 * Will run a command.
 * @param {*} linkName 
 * @param {*} params 
 * @param {*} cmd 
 */
export function executeCommand(linkName, params, cmd) {
    const store = loadStore();
    const link = store.resolve[linkName];
    if (!link) return console.log(LOG_HELPER.ERR(
        `Failed to find ${LOG_HELPER.INLINE_STAND_OUT(linkName)} as a valid link.`
    ));
    const child = child_process.fork(link, params, { stdio: "inherit" });
    child.once('close', code => process.exit(code));
}

/**
 * List command body.
 */
export function listCustomCommands() {
    const { resolve } = loadStore();
    const resolvedKeys = _.keys(resolve);
    const trees = [];
    _.forEach(_.values(resolve), (resolution, index) => {
        const packageJSON = path.join(path.dirname(resolution), 'package.json');
        if (fs.existsSync(packageJSON))
        {
            const parsedManifest = require(packageJSON);
            if(parsedManifest && parsedManifest.description)
                var desc = chalk.yellow(parsedManifest.description);
        }
        const tree = {
            name: resolvedKeys[index],
            script: resolution,
            description: desc ||
                LOG_HELPER.INLINE_STAND_OUT(
                    `No description`
                )
        };
        trees.push(tree);
    });  
    console.log(LOG_HELPER.INFO_CUSTOM("Display your commands", '', ...trees.map(tree => asTree(tree, true))))
}



/**
 * Weather or not this file is valid.
 * @param {*} url 
 */
export const exists = url => fs.existsSync(url);

/**
 * Will fire a function that acts as the default command.
 * NOTE: THIS IS FIRED WHEN NO ARGS ARE PASSED. so fire a function that requires zero args or
 * can operate with zero args.
 */
export const defaultCommand = listCustomCommands;