
import path from 'path';
import { omit } from 'lodash';
import { loadStore, saveStore } from './helpers.js';
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
                    chalk.red(`That link already exists. If you wish to remove the link please run ${chalk.yellow(`tb remove-link ${name}`)}`) + "\n" +
                    chalk.red(`If you wish to overwrite this then run this: ${chalk.yellow(`tb create-link -o ${name} ${p}`)} or run ${chalk.yellow(`tb update-link ${name} ${p}`)}`)
                );
            store.resolve[name] = parsedPath;
            saveStore(store);
            console.log(chalk.green(`Success! now run ${p} with tb run ${name}`));
        });
    
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

export const executionCommand = program =>
    program.command('run <linkName> [params...]')
        .action((linkName, params = [], cmd) => {
            const store = loadStore();
            const link = store.resolve[linkName];
            if (!link) return console.log(chalk.red(`Failed to find ${linkName} as a valid link.`));
            child_process.exec(`node ${link} ${params.join(" ")}`, (err, stdout, stderr) => {
                console.log("==================");
                if (err) return console.log(chalk.red(err));
                if (stderr) return console.log(chalk.red(stderr));
                if (stdout) console.log(stdout);
            });
        });