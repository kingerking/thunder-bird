
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
 * Reason for a white list is because if a user tries to overwrite a default command(thunder-bird command)
 * then an TypeError will take place:
 * ERR: [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received type object
 * I understand this object is redundant, but its worth using for software integrity.
 */
export const WHITELIST = {
    create: 'create',
    list: 'list',
    search: 'search',
    "update-path": 'update-path',
    "update-name": "update-name",
    remove: "remove",
    run: "run",
    set: "set",
    get: "get",
    use: "use",
    store: "store",
    // create this command with pm2 in future.
    // schedule: "schedule"
}

/**
 * Will ensure users dont overwrite default commands. will not allow command creation with default command names.
 * @param {string} cmd Command to query the whitelist for.
 */
export function checkWhitelist(cmd) {
    const ar = _.values(WHITELIST).filter(entity => cmd == entity);
    return ar.length;
}

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
    log.common(LOG_HELPER.INFO(
        `in script execution body, with following info.`,
        `linkName: ${linkName}`,
        `params: ${params}`
    ))
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
export function listCustomCommands(customResolve) {
    // Use all resolutions by default.
    if (!customResolve) var { resolve } = loadStore();
    // If user wants to only display custom resolutions then use
    // customResolve as resolution storage.
    else var resolve = customResolve;
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
    console.log(LOG_HELPER.INFO_CUSTOM(customResolve ? "Your search results" : "Display your commands", '', ...trees.map(tree => asTree(tree, true))))
}

/**
 * Apply a key value pair to the store.settings.
 * @param {*} property 
 * @param {*} value 
 */
export function storeSet(property, value) {
    const store = loadStore();
    if (!store) return console.log(LOG_HELPER.ERR("Failed to load store.")) && false;
    const { settings } = store;
    if (!settings) {
        log.common(LOG_HELPER.ERR(
            `Settings structure is invalid.`,
            `settings is ${LOG_HELPER.INLINE_STAND_OUT("null")}`
        ));
        return console.log(LOG_HELPER.ERR("Store format is invalid")) && false;
    }
    settings[property] = value;
    if (value)
        store.settings = settings;
    else
        store.settings = _.omit(settings, [property]);    
    saveStore(store, true);
    return true;
}

/**
 * Resolve a name.
 */
export const resolveNameViaPackageJson = absolutePath => 
    path.basename(path.dirname(path.resolve(absolutePath)));


export function schedule() {

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