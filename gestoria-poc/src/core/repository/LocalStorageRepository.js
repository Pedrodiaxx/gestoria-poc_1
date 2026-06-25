import { IRepository } from './IRepository';

export class LocalStorageRepository extends IRepository {
  constructor(key, defaultValue) {
    super();
    this.key = key;
    this.defaultValue = defaultValue;
  }

  getAll() {
    const saved = localStorage.getItem(this.key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Error parsing localStorage key "${this.key}"`, e);
      }
    }
    return this.defaultValue;
  }

  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }
}
