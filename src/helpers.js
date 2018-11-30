
import { merge, values } from 'lodash';
import { storageFileURL } from './index';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * Will add a + so users know something is assoiated with a given log
 */
function replaceNewLineWithPlus(lineBuffer) {
    const lines = lineBuffer.split('\n').map(element => element.replace('\n', ''));
    return lines.join(`\n  ${chalk.bold(chalk.yellow("+"))}  `);
}

/**
 * Helper for logs.
 */
export const LOG_HELPER = {
    INFO: (...str) => `${chalk.bold(chalk.yellow('Info'))} ${chalk.gray(replaceNewLineWithPlus(str.join('\n')))}`,
    ERR: (...str) => `${chalk.bold(chalk.red('Error'))} ${replaceNewLineWithPlus(str.join('\n'))}`,
    CMD: (...str) => `${chalk.bold(chalk.magenta('CMD'))} ${chalk.cyan(replaceNewLineWithPlus(str.join('\n')))}`,
    INLINE_CMD: (...str) => `${chalk.cyan(replaceNewLineWithPlus(str.join('\n')))}`
}


/**
 * Load the storage buffer.
 * (make sure to save after editting.)
 */
export function loadStore() {
    const storageObject = JSON.parse(fs.readFileSync(storageFileURL));
    if (!storageObject) throw new Error("Failed to resolve thunder-bird store file.");
    return storageObject;
}


/**
 * Will make all the linked files executable.
 */
export function permissionLinks() {
    const { resolve } = loadStore();
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
export function saveStore(store = {}, absolute = false) {
    if (!absolute) {
        var currentStore = loadStore();
        var newStore = merge(currentStore, store);
    } else if(absolute) var newStore = store;
    fs.writeFileSync(storageFileURL, JSON.stringify(newStore, null, 4));
    permissionLinks();
}


/**
 * Weather or not this file is valid.
 * @param {*} url 
 */
export const exists = url => fs.existsSync(url);