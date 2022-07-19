import _, { cond, update } from 'lodash';
import {readFile, writeFile} from 'fs/promises'
import {v4} from 'uuid';

export default class StorageAPI<T extends {id: string }> {
    private storage: T[];
    private _path: string;

    constructor(path: string) {
        this.storage = [];
        this._path = path;
        this.loadFromLocal();
    }

    async loadFromLocal() {
        this.storage = JSON.parse(await readFile(this._path, "utf8"));
    }

    async saveLocal() {
        await writeFile(this._path,JSON.stringify(this.storage));
    }

    addToStorage(newObject: T) {
        this.storage.push({...newObject, id: v4()});
        this.saveLocal();
    }

    where(conditions: Partial<T>): T[] {
        return _.filter(this.storage, _.matches(conditions));
    }

    removeFromStorage(conditions: Partial<T>) {
        this.storage = _.remove(this.storage, _.matches(conditions));
        this.saveLocal();
        return this.storage;
    }
    contains(conditions: Partial<T>): boolean {
        return this.where(conditions).length > 0;
    }
    update(id: string, updateValue: Partial<T>) {
        const valueIndex = this.storage.findIndex(value => value.id === id);
        this.storage[valueIndex] = {
            ...this.storage[valueIndex],
            ...updateValue
        };
        this.saveLocal();
    }
    

}