
import path from 'path';
import { omit, values } from 'lodash';
import { loadStore, saveStore, exists } from './helpers.js';
import chalk from 'chalk';
import child_process from 'child_process';

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
                return console.log(
                    chalk.red(`That link already exists. If you wish to remove the link please run ${chalk.yellow(`tb remove ${name}`)}`) + "\n" +
                    chalk.red(`If you wish to overwrite this then run this: ${chalk.yellow(`tb create-link -o ${name} ${p}`)} or run ${chalk.yellow(`tb update-link ${name} ${p}`)}`)
                );
            store.resolve[name] = parsedPath;
            saveStore(store);
            console.log(chalk.green(`Success! now run ${p} with tb run ${name}`));
        });
    
export const updatePathCommand = program =>
    program.command("update-path <name> <newPath>")
        .action((name, newPath, cmd) => {
            const parsedPath = path.resolve(newPath);
            const store = loadStore();
            const entity = store.resolve[name];
            if (!entity) return console.log(chalk.red(`Failed to resolve entity with name of ${name}`));
            const newResolutions = omit(store.resolve, name);
            newResolutions[name] = parsedPath;
            store.resolve = newResolutions;
            saveStore(store, true);
            console.log(chalk.green("Updated path."));
        });

export const updateNameCommand = program => 
    program.command("update-name <name> <newName>")
    .action((currentName, newName, cmd) => {
        const store = loadStore();
        const entity = store.resolve[currentName];
        if (!entity) return console.log(chalk.red(`Failed to resolve entity with name of ${currentName}`));
        const newResolutions = omit(store.resolve, currentName);
        newResolutions[newName] = entity;
        saveStore(store, true);
    })

export const removeCommand = program =>
    program.command('remove <name>')
        .action((name, cmd) => {
            const store = loadStore();
            const path = store.resolve[name];
            if (!path) return console.log(chalk.red(`Failed to find path with name: ${name}`));
            store.resolve = omit(store.resolve, [name]);
            saveStore(store, true);
            console.log(chalk.green(`Successfully removed the store with the name ${name}`));
        });

/**
 * Will run a linked command(use tb create <name> <relative file url>).
 * @param {*} program 
 */
export const executionCommand = program =>
    program.command('run <linkName> [params...]')
        .action((linkName, params = [], cmd) => {
            const store = loadStore();
            const link = store.resolve[linkName];
            if (!link) return console.log(chalk.red(`Failed to find ${linkName} as a valid link.`));
            const bufferLimit = store.settings.bufferLimit ? Number.parseInt(store.settings.bufferLimit) : 1024 * 1024 * 2;
            const child = child_process.fork(link, params);
            child.on('message', data => process.stdout.write(data + "\n"));
            child.on('error', data => process.stderr.write(chalk.red(data + "\n")));
            child.on('exit', (code, signal) => process.exit(code));
            
        });
