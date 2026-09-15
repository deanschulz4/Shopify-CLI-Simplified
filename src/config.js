import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const filename = '.sshop.json';
const own = (object, key) => Object.hasOwn(object, key);
export function normalizeStore(value) {
  if (typeof value !== 'string') throw new Error('Store must be a string.');
  const slug = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\.myshopify\.com$/, '');
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) || slug.length > 63) {
    throw new Error(`Invalid Shopify store: ${value}. Use a store prefix or a myshopify.com domain.`);
  }
  return `${slug}.myshopify.com`;
}
export function validateAlias(alias) {
  if (!/^[a-z][a-z0-9_-]*$/.test(alias) || ['__proto__', 'prototype', 'constructor'].includes(alias)) {
    throw new Error('Alias must start with a lowercase letter and contain only lowercase letters, digits, _ or -.');
  }
}
export function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Config must be a JSON object.');
  for (const key of Object.keys(config)) {
    if (!['version', 'stores', 'defaultStore', 'defaults'].includes(key)) throw new Error(`Unknown config key: ${key}`);
  }
  if (config.version !== 1) throw new Error('Config version must be 1.');
  if (!config.stores || typeof config.stores !== 'object' || Array.isArray(config.stores)) throw new Error('Config stores must be an object.');
  for (const [alias, store] of Object.entries(config.stores)) { validateAlias(alias); normalizeStore(store); }
  if (config.defaultStore !== undefined && config.defaultStore !== null) {
    if (typeof config.defaultStore !== 'string' || !config.defaultStore.trim()) throw new Error('defaultStore must be a store alias, domain, or null.');
    if (!own(config.stores, config.defaultStore)) normalizeStore(config.defaultStore);
  }
  if (config.defaults !== undefined) {
    if (!config.defaults || typeof config.defaults !== 'object' || Array.isArray(config.defaults)) throw new Error('defaults must be an object.');
    for (const [key, value] of Object.entries(config.defaults)) {
      if (!['nodelete', 'themeEditorSync'].includes(key) || typeof value !== 'boolean') throw new Error(`Invalid default: ${key}. Supported boolean defaults: nodelete, themeEditorSync.`);
    }
  }
  return config;
}
export function readConfig(file) {
  try { return validateConfig(JSON.parse(fs.readFileSync(file, 'utf8'))); }
  catch (error) { throw new Error(`${file}: ${error.message}`); }
}
export function loadConfig({ cwd = process.cwd(), home = os.homedir(), explicit = process.env.SSHOP_CONFIG } = {}) {
  const globalFile = path.join(home, filename);
  let files = [];
  if (explicit) {
    files = [path.resolve(cwd, explicit)];
  } else {
    if (fs.existsSync(globalFile)) files.push(globalFile);
    let directory = path.resolve(cwd);
    while (true) {
      const candidate = path.join(directory, filename);
      if (fs.existsSync(candidate)) { if (!files.includes(candidate)) files.push(candidate); break; }
      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  let config = { version: 1, stores: {}, defaults: { nodelete: true, themeEditorSync: true } };
  for (const file of files) {
    const next = readConfig(file);
    config = { ...config, ...next, stores: { ...config.stores, ...next.stores }, defaults: { ...config.defaults, ...next.defaults } };
  }
  return { config, files };
}
export function writeConfig(file, config, { create = false } = {}) {
  validateConfig(config);
  const data = `${JSON.stringify(config, null, 2)}\n`;
  if (create) { fs.writeFileSync(file, data, { flag: 'wx', mode: 0o600 }); return; }
  const temporary = `${file}.${randomUUID()}.tmp`;
  try { fs.writeFileSync(temporary, data, { flag: 'wx', mode: 0o600 }); fs.renameSync(temporary, file); }
  finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
// Parse only literal map_store case entries. Never source or execute the legacy file.
export function importAliases(source) {
  const block = source.match(/map_store\(\)\s*\{([\s\S]*?)\n\}/)?.[1];
  if (!block) throw new Error('No map_store() block found.');
  const stores = {};
  for (const match of block.matchAll(/^\s*([a-z][a-z0-9_-]*)\)\s*printf\s+'%s'\s+'([^']+)'\s*;;\s*$/gm)) {
    const [, alias, store] = match;
    validateAlias(alias);
    const normalized = normalizeStore(store);
    if (own(stores, alias) && stores[alias] !== normalized) throw new Error(`Conflicting legacy alias: ${alias}`);
    stores[alias] = normalized;
  }
  if (!Object.keys(stores).length) throw new Error('No supported literal store mappings found.');
  return stores;
}
