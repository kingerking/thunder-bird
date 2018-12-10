
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import {
    storeLocation,
    loadStore,
    saveStore,
    schedule,
    LOG_HELPER,
    executeCommand,
    log,
    listCustomCommands,
    WHITELIST,
    checkWhitelist,
    storeSet,
    storeGet,
    resolveNameViaPackageJson
} from './helpers.js';
import chalk from 'chalk';
import { asTree } from 'treeify';

export const useCommand = program =>
    program.command(`${WHITELIST.use} [directory]`)
        .description("Use a given directory to build a list of commands(This is useful for organizing your commands into one directory.)")
        .action((dir = '.', cmd) => {
            log.common("In command body..")
            const resolved = path.resolve(dir);
            if (!resolved) return console.log(LOG_HELPER.ERR(
                `Error while resolving URL for 'use' command.`
            ));
            try {
                const directoryListing = fs.readdirSync(resolved);
                var resolvedDirectoryListing = directoryListing.map(listing =>
                    path.resolve(path.join(resolved, listing)));
            } catch (e) {
                return console.log(LOG_HELPER.ERR(
                    "we encountered an error while reading this directory(error, directoryListing, resolvedDirectoryListing)",
                    e, directoryListing, resolvedDirectoryListing)
                );
            }

            console.log("listing: ", resolvedDirectoryListing);

        });

/**
 * Basic command
 * @param {*} program 
 */
export const creationCommand = program =>
    program.command(`${WHITELIST.create} <name> [path]`)
        .description("Create a custom command.")
        .option('-o, --overwrite', "Overwrite existing links.")
        .option('-i, --inherit', "Inherit a files parent directory name to use as the command name.")
        .action((name, p = 'index.js', cmd) => {

            // this will allow users to use the target files parent directory name as the command name.
            if (cmd.inherit) {
                // since no first arg will be supplied the current state of name will become path.
                p = name;
                name = resolveNameViaPackageJson(p);
            }
            if (checkWhitelist(name)) return console.log(LOG_HELPER.ERR(
                `${name} is a white-listed command(internal), please pick a different name.`
            ));
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
    program.command(WHITELIST.list)
        .description("List all your commands you have registered with thunder-bird.")
        .action((path, cmd) => listCustomCommands(cmd));
    
export const searchCommand = program =>
    program.command(`${WHITELIST.search} <query>`)
        .description(`Search a command name.`)
        .action((query, cmd) => {
            log.common(LOG_HELPER.INFO(
                'Search command starts',
                'loading store...'
            ))
            const { resolve } = loadStore();
            // if user doesnt pass any query then return all commands
            if (!query || query == '') {
                log.common(LOG_HELPER.INFO(
                    `no query: ${query}, typeof query: ${typeof query}`
                ));
                return listCustomCommands(resolve);
            }
            if (!resolve) return console.log(LOG_HELPER.ERR("Could not load store resolutions."));
            const keys = _.keys(resolve);
            const searchResultResolve = {};
            keys.forEach(key => {
                if (!key.match(query)) return;
                const resolution = resolve[key];
                if (!resolution) return;
                searchResultResolve[key] = resolve[key];
            })
            listCustomCommands(searchResultResolve);
        });

export const updatePathCommand = program =>
    program.command(`${WHITELIST['update-path']} <name> <newPath>`)
        .description("Update a commands registered target script.")
        .action((name, newPath, cmd) => {
            const parsedPath = path.resolve(newPath);
            const store = loadStore();
            const entity = store.resolve[name];
            if (!entity) return console.log(LOG_HELPER.ERR(
                `Failed to resolve entity with name of ${LOG_HELPER.INLINE_STAND_OUT(name)}`
            ));
            const newResolutions = _.omit(store.resolve, name);
            newResolutions[name] = parsedPath;
            store.resolve = newResolutions;
            saveStore(store, true);
            console.log(LOG_HELPER.INFO(
                `Successfully updated ${LOG_HELPER.INLINE_STAND_OUT(name + "'s")} path to ${LOG_HELPER.INLINE_STAND_OUT(parsedPath)}`
            ));
        });

export const updateNameCommand = program => 
    program.command(`${WHITELIST['update-name']} <name> <newName>`)
        .description("Update a commands registered name for a targeted script.")
        .action((currentName, newName, cmd) => {
        log.common('executing update-name command.');
            const store = loadStore();
            log.common_large(LOG_HELPER.INFO_CUSTOM("Resolution Search", currentName, asTree(store.resolve)));
            const entity = store.resolve[currentName];
            if (!entity) return console.log(LOG_HELPER.ERR(
                `Failed to resolve entity with name of ${LOG_HELPER.INLINE_STAND_OUT(currentName)}`
            ));
            log.common(LOG_HELPER.INFO(
                `Success, Resolved entity`,
                `${currentName}: ${entity}`
            ));    
            const newResolutions = _.omit(store.resolve, currentName);
            newResolutions[newName] = entity;
            log.common(LOG_HELPER.INFO_CUSTOM('Store File:resolve(new)(unsaved)',
                `Resolved new store resolutions`,
                asTree(newResolutions, true, true)
            ));
            store.resolve = newResolutions;
            saveStore(store, false);
    })

export const removeCommand = program =>
    program.command(`${WHITELIST.remove} <name>`)
        .description("Remove a custom/installed command from thunder bird.")
        .action((name, cmd) => {
            const store = loadStore();
            const path = store.resolve[name];
            if (!path) return console.log(LOG_HELPER.ERR(
                `Failed to find path with name: ${LOG_HELPER.INLINE_STAND_OUT(name)}`
            ));
            store.resolve = _.omit(store.resolve, [name]);
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
    program.command(`${WHITELIST.run} <linkName> [params...]`)
        .description(`Run a thunder bird installed/custom command, ${LOG_HELPER.INLINE_STAND_OUT('tb <linkName>')} is short hand for this command.`)
        .action((linkName, params = [], cmd) => {
            log.common(LOG_HELPER.INFO(
                `Run command executing, running script now.`
            ))
            executeCommand(linkName, params, cmd);
        });

export const setSetting = program =>
    program.command(`${WHITELIST.set} <settingName> [settingValue]`)
        .description("Apply a value to a setting. No value supplied will result in the setting being removed.")
        .action((settingName, settingValue = null, cmd) => {
            log.common(LOG_HELPER.INFO(
                `In settings "set" body.`
            ));
            if (!settingName) return console.log(LOG_HELPER.ERR("Cannot set a settings key without an identifer."));
            if (!storeSet(settingName, settingValue)) return console.log(LOG_HELPER.ERR("Failed to set settings key."));
            console.log(LOG_HELPER.INFO(
                `Successfully set ${settingName} to ${settingValue}`
            ));
        });

export const getSetting = program =>
    program.command(`${WHITELIST.get} <settingName>`)
        .description("View a readout of a part of the settings object.")
        .action((settingName, cmd) => {
            log.common(LOG_HELPER.INFO(
                `In settings "get" body.`
            ));
            const { settings } = loadStore();
            if (!settings) return console.log(LOG_HELPER.ERR("Failed to load settings object from store."));
            const value = settings[settingName];
            if (!value) return console.log(LOG_HELPER.ERR(`Failed to find ${settingName} as a valid settings property.`));
            if (!settingName) return console.log(LOG_HELPER.ERR("Cannot get a settings key without an identifer."));
            console.log(LOG_HELPER.INFO(
                `${settingName}: ${value}`
            ));
        });

export const storeCommand = program =>
    program.command(`${WHITELIST.store}`)
    .description('View the current state of the store object.')
        .action((path, cmd) => {
            const store = loadStore();
            if (!store) return console.log(LOG_HELPER.ERR('failed to load store.'));
            console.log(LOG_HELPER.INFO_CUSTOM(`Store File ReadOut`, chalk.green(storeLocation),
                asTree(store, true)
            ))
        })
    
/**
 * Schedule a script task.
 * @param {*} program 
 */
export const scheduleCommand = program =>
    program.command(`${WHITELIST.schedule} <name> <when>`)
        .description("Schedule a script to run")
        .action((name, when, cmd) => {
            
        });