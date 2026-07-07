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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && Array.isArray(this.defaultValue)) {
          const identifier = this.key === 'giu_conceptos' ? 'clave' : 'id';
          const merged = [...parsed];
          this.defaultValue.forEach(defaultItem => {
            const exists = parsed.some(item => item[identifier] === defaultItem[identifier]);
            if (!exists) {
              merged.push(defaultItem);
            }
          });
          return merged;
        }
        return parsed;
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
