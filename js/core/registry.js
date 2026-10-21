import builtIn from '../../modules/index.js';
import { normalizeModule } from './module.js';
import { store } from './storage.js';

const builtInModules = builtIn.map(normalizeModule);

export function allModules() {
  const custom = store.customModules().map(def => normalizeModule({ ...def, custom: true }));
  return [...builtInModules, ...custom];
}

export function getModule(id) {
  return allModules().find(m => m.id === id) || null;
}
