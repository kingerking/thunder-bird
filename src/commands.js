
import path from 'path';
import fs from 'fs';
import { loadStore, saveStore } from './helpers.js';
import { storageFileURL } from './index';
import chalk from 'chalk';

/**
 * Basic command
 * @param {*} program 
 */
export const linkCreationCommand = program =>
    program.command('create-link <name> [path]')
        .option('-o, --overwrite', "Overwrite existing links.")
        .action((name, p = 'index.js', cmd) => {
            const parsedPath = path.resolve(p);
            console.log(chalk.yellow("Loading Store..."));
            const store = loadStore();
            console.log(chalk.green("Store loaded!"));
            if (store.resolve[name] && !cmd.overwrite) // name exists.
                return console.log(
                    chalk.red(`That link already exists. If you wish to remove the link please run ${chalk.yellow(`tb remove-link ${name}`)}`) + "\n" +
                    chalk.red(`If you wish to overwrite this then run this: ${chalk.yellow(`tb create-link -o ${name} ${p}`)} or run ${chalk.yellow(`tb update-link ${name} ${p}`)}`)
                );
            store.resolve[name] = parsedPath;
            console.log(chalk.yellow("Saving Store..."));
            saveStore(store);
            console.log(chalk.green("Store Saved!"));
    });

export const testCommand2 = program =>
    program.command('test2 <param>')
    .option('-p', '--peppers', 'Add some peppers')
    .action((dir, cmd) => {
        const [, , ...args] = process.argv;
        console.log("args: ", args);
    });