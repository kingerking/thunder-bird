
import path from 'path';
import { omit, forEach, values, keys } from 'lodash';
import { loadStore, saveStore, LOG_HELPER, executeCommand } from './helpers.js';
import chalk from 'chalk';

/**
 * Basic command
 * @param {*} program 
 */
export const creationCommand = program =>
    program.command('create <name> [path]')
        .option('-o, --overwrite', "Overwrite existing links.")
        .action((name, p = 'index.js', cmd) => {
            const parsedPath = path.resolve(p);
            const store = loadStore();
            if (store.resolve[name] && !cmd.overwrite) // name exists.
                return console.log(LOG_HELPER.ERR(
                    `That link already exists.`,
                    `If you wish to remove the link please run ${LOG_HELPER.INLINE_CMD(`tb remove ${name}`)}`,
                    `If you wish to overwrite this then run: ${LOG_HELPER.INLINE_CMD(`tb create -o ${name} ${p}`)}`,
                    `or run ${LOG_HELPER.INLINE_CMD(`tb update-link ${name} ${p}`)}`
                ));
            store.resolve[name] = parsedPath;
            saveStore(store);
            console.log(LOG_HELPER.INFO(`Success! now run your file with ${LOG_HELPER.INLINE_CMD(`tb ${name}`)}`));
        });

export const listCommand = program =>
    program.command('list')
        .action((cmd) => {
            const { resolve } = loadStore();
            const resolvedKeys = keys(resolve);
            forEach(values(resolve), (resolution, index) => {
                console.log(LOG_HELPER.INFO(`Name: ${LOG_HELPER.INLINE_STAND_OUT(resolvedKeys[index])}, Script: ${LOG_HELPER.INLINE_STAND_OUT(resolution)}`));
            });        
    });
    
export const updatePathCommand = program =>
    program.command("update-path <name> <newPath>")
        .action((name, newPath, cmd) => {
            const parsedPath = path.resolve(newPath);
            const store = loadStore();
            const entity = store.resolve[name];
            if (!entity) return console.log(LOG_HELPER.ERR(
                `Failed to resolve entity with name of ${LOG_HELPER.INLINE_STAND_OUT(name)}`
            ));
            const newResolutions = omit(store.resolve, name);
            newResolutions[name] = parsedPath;
            store.resolve = newResolutions;
            saveStore(store, true);
            console.log(LOG_HELPER.INFO(
                `Successfully updated ${LOG_HELPER.INLINE_STAND_OUT(name + "'s")} path to ${LOG_HELPER.INLINE_STAND_OUT(parsedPath)}`
            ));
        });

export const updateNameCommand = program => 
    program.command("update-name <name> <newName>")
    .action((currentName, newName, cmd) => {
        const store = loadStore();
        const entity = store.resolve[currentName];
        if (!entity) return console.log(LOG_HELPER.ERR(
            `Failed to resolve entity with name of ${LOG_HELPER.INLINE_STAND_OUT(currentName)}`
        ));
        const newResolutions = omit(store.resolve, currentName);
        newResolutions[newName] = entity;
        saveStore(store, true);
    })

export const removeCommand = program =>
    program.command('remove <name>')
        .action((name, cmd) => {
            const store = loadStore();
            const path = store.resolve[name];
            if (!path) return console.log(LOG_HELPER.ERR(
                `Failed to find path with name: ${LOG_HELPER.INLINE_STAND_OUT(name)}`
            ));
            store.resolve = omit(store.resolve, [name]);
            saveStore(store, true);
            console.log(LOG_HELPER.INFO(
                `Successfully removed the command with the name ${LOG_HELPER.INLINE_STAND_OUT(name)}`
            ));
        });

/**
 * Will run a linked command(use tb create <name> <relative file url>).
 * @param {*} program 
 */
export const executionCommand = program =>
    program.command('run <linkName> [params...]')
        .action((linkName, params = [], cmd) => {
            executeCommand(linkName, params, cmd);
        });
