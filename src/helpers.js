
import { merge, values } from 'lodash';
import { storageFileURL } from './index';
import fs from 'fs';
import path from 'path';

/**
 * Edit and save the storage object.
 */
export function loadStore() {
    const storageObject = JSON.parse(fs.readFileSync(storageFileURL));
    if (!storageObject) throw new Error("Failed to resolve thunder-bird store file.");
    return storageObject;
}

export function saveStore(store = {}, absolute = false) {
    if (!absolute) {
        var currentStore = loadStore();
        var newStore = merge(currentStore, store);
    } else if(absolute) var newStore = store;
    fs.writeFileSync(storageFileURL, JSON.stringify(newStore, null, 4));
    this.permissionLinks();
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
 * Weather or not this file is valid.
 * @param {*} url 
 */
export const exists = url => fs.existsSync(url);