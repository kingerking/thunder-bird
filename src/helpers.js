
import { merge, values } from 'lodash';
import { storageFileURL } from './index';
import child_process from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

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
    INFO: (...str) => `${chalk.bold(chalk.yellow('Info'))} ${chalk.gray(replaceNewLineWithPlus(str.join('\n')))}`,
    ERR: (...str) => `${chalk.bold(chalk.red('Error'))} ${chalk.gray(replaceNewLineWithPlus(str.join('\n'), chalk.red))}`,
    CMD: (...str) => `${chalk.bold(chalk.magenta('CMD'))} ${chalk.cyan(replaceNewLineWithPlus(str.join('\n')))}`,
    INLINE_CMD: (...str) => `${chalk.cyan(replaceNewLineWithPlus(str.join('\n')))}`,
    INLINE_STAND_OUT: (...str) => `${chalk.bold(chalk.magenta(replaceNewLineWithPlus(str.join('\n'))))}`
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
    const child = child_process.fork(link, params, {
        stdio: "inherit"
    });
    // child.stdout.pipe(process.stdout);
    // child.stderr.pipe(process.stderr);
    // child.stdin.pipe(process.stdin);
    // child.on('message', data => process.stdout.write(data + "\n"));
    // child.on('error', data => process.stderr.write(chalk.red(data + "\n")));
    // child.on('exit', (code, signal) => process.exit(code));
}

/**
 * Weather or not this file is valid.
 * @param {*} url 
 */
export const exists = url => fs.existsSync(url);