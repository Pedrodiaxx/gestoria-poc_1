import { IRepository } from './IRepository';

/**
 * LocalStorageRepository — Solo persiste entidades de autenticación local
 * (usuarios y roles). Las entidades de negocio (clientes, cotizaciones,
 * proyectos, presupuestos, tareas, conceptos) se cargan exclusivamente
 * desde la API remota (PostgreSQL en Render).
 */
export class LocalStorageRepository extends IRepository {
  constructor(key, defaultValue) {
    super();
    this.key = key;
    this.defaultValue = defaultValue;
    // Only these keys are allowed to use LocalStorage
    this._localKeys = new Set(['giu_usuarios', 'giu_roles']);
  }

  getAll() {
    // Business entities: return empty — the API is the source of truth
    if (!this._localKeys.has(this.key)) {
      return [];
    }
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
    // Business entities: no-op — never write to LocalStorage
    if (!this._localKeys.has(this.key)) {
      return;
    }
    localStorage.setItem(this.key, JSON.stringify(data));
  }
}
