
import { merge } from 'lodash';
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

export function saveStore(store = {}) {
    const currentStore = loadStore();
    const newStore = merge(currentStore, store);
    fs.writeFileSync(storageFileURL, JSON.stringify(newStore, null, 4));
}