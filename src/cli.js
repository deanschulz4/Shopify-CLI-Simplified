import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { filename, loadConfig, readConfig, writeConfig, normalizeStore, validateAlias, importAliases } from './config.js';
import { buildCommand, formatCommand } from './commands.js';

const help = `Simplified Shopify CLI (sshop)

Usage: sshop [--config FILE] COMMAND [arguments]

  init [--global]                    Create an empty config (never overwrites)
  stores                            List merged store aliases
  stores add ALIAS STORE [--global]  Add/update a store in the selected config
  stores remove ALIAS [--global]     Remove a store from the selected config
  stores . [--global]                Open the stores config file in your editor
  import FILE [--global]             Import literal map_store aliases
  config                            Show effective config and source files
  shell [powershell]                Print shell functions (optional)

  list|sl [store]                    List all themes
  info|si [store]                    Show theme environment
  dev|sd [store] [theme]             Develop with Theme Editor sync
  pull|sp [store] [theme] [-p]       Pull theme, preserving unmatched local files
  pull-json|spl [store] [theme]      Pull templates/config JSON only
  pull-all|spa [store] [theme]       Pull without --nodelete
  check|sc                          Run Theme Check
  fix|sf                            Auto-correct Theme Check findings
  logout|lo                         Log out of Shopify

Options: --store/-s STORE, --theme/-t THEME, --dry-run
Dev options: --port/-p PORT (example: sd demo -p 9293)
List/info options: --json/-j (example: sl demo -j)
Pull options: --live, --development/-d, --json-only/-p
Info options: --development/-d
Config writes: --global/-g (init, import; stores add/remove/. default to global)
Additional Shopify flags go after -- (example: -- --port 9293).
Select the current store with si STORE; then omit STORE on later theme commands.
A configured defaultStore overrides the remembered Shopify store. Use si to check.
Use explicit --store for an unmapped store prefix with no theme.
Pull defaults to the live theme. Dev without a theme uses a development theme.
Config order: ~/.sshop.json, nearest .sshop.json; --config or SSHOP_CONFIG isolates.
Direct commands: sd, sp, sl, si, spl, spa, sc, sf, lo.
Setup commands: sinit, sstores, sconfig, simport, shelp.
`;

export async function main(argv, { open = openPath } = {}) {
  const args = [...argv];
  let explicit = process.env.SSHOP_CONFIG;
  if (args[0] === '--config') {
    explicit = args[1];
    if (!explicit || explicit.startsWith('-')) throw new Error('Provide a file after --config.');
    args.splice(0, 2);
  }
  const command = args.shift();
  if (!command || ['--help', '-h', 'help'].includes(command)) { console.log(help); return 0; }
  if (command === '--version') {
    console.log(JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version); return 0;
  }
  if (command === 'shell') {
    if (args.length > 1 || (args.length === 1 && args[0] !== 'powershell')) throw new Error('Usage: sshop shell [powershell]');
    console.log(fs.readFileSync(new URL(args[0] === 'powershell' ? '../shell/shortcuts.ps1' : '../shell/shortcuts.sh', import.meta.url), 'utf8')); return 0;
  }
  const mutation = command === 'init' || command === 'import' || (command === 'stores' && ['add', 'remove'].includes(args[0]));
  if (mutation) {
    const normalized = args.map(arg => arg === '-g' ? '--global' : arg);
    const global = normalized.includes('--global');
    if (global && explicit) throw new Error('Choose --global or --config, not both.');
    if (normalized.filter(arg => arg === '--global').length > 1) throw new Error('Repeated --global option.');
    const values = normalized.filter(arg => arg !== '--global');
    const file = explicit ? path.resolve(explicit) : path.join(global ? os.homedir() : process.cwd(), filename);
    if (command === 'init') {
      if (values.length) throw new Error('Usage: sshop init [--global]');
      writeConfig(file, { version: 1, stores: {}, defaults: { nodelete: true, themeEditorSync: true } }, { create: true });
    } else {
      const config = fs.existsSync(file) ? readConfig(file) : { version: 1, stores: {} };
      if (command === 'import') {
        if (values.length !== 1) throw new Error('Usage: sshop import FILE [--global]');
        const stores = importAliases(fs.readFileSync(values[0], 'utf8'));
        for (const [alias, store] of Object.entries(stores)) {
          if (Object.hasOwn(config.stores, alias) && normalizeStore(config.stores[alias]) !== store) throw new Error(`Import would overwrite alias ${alias}. Remove or update it explicitly first.`);
        }
        config.stores = { ...config.stores, ...stores };
        console.log(`Imported ${Object.keys(stores).length} unique store aliases.`);
      } else if (values[0] === 'add') {
        if (values.length !== 3) throw new Error('Usage: sshop stores add ALIAS STORE [--global]');
        validateAlias(values[1]); config.stores[values[1]] = normalizeStore(values[2]);
      } else {
        if (values.length !== 2) throw new Error('Usage: sshop stores remove ALIAS [--global]');
        if (!Object.hasOwn(config.stores, values[1])) throw new Error(`Alias ${values[1]} does not exist in ${file}.`);
        delete config.stores[values[1]];
        if (config.defaultStore === values[1]) config.defaultStore = null;
      }
      writeConfig(file, config, { create: !fs.existsSync(file) });
    }
    console.log(`Saved ${file}`); return 0;
  }
  if (command === 'stores' && args[0] === '.') {
    const normalized = args.map(arg => arg === '-g' ? '--global' : arg);
    const useGlobal = normalized.includes('--global');
    if (normalized.filter(arg => arg !== '--global' && arg !== '.').length) throw new Error('Usage: sshop stores . [--global]');
    if (useGlobal && explicit) throw new Error('Choose --global or --config, not both.');
    const file = explicit ? path.resolve(explicit) : path.join(useGlobal ? os.homedir() : process.cwd(), filename);
    if (!fs.existsSync(file)) {
      writeConfig(file, { version: 1, stores: {}, defaults: { nodelete: true, themeEditorSync: true } }, { create: true });
      console.log(`Created ${file}`);
    }
    await open(file);
    return 0;
  }
  const loaded = loadConfig({ explicit });
  if (command === 'config') {
    if (args.length) throw new Error('Usage: sshop config');
    console.log(JSON.stringify(loaded, null, 2)); return 0;
  }
  if (command === 'stores') {
    if (args.length && !(args.length === 1 && args[0] === 'list')) throw new Error('Usage: sshop stores [list|add|remove|.]');
    const entries = Object.entries(loaded.config.stores).sort(([a], [b]) => a.localeCompare(b));
    console.log(entries.length ? entries.map(([alias, store]) => `${alias}\t${normalizeStore(store)}`).join('\n') : 'No store aliases yet. Run: sshop stores add demo example-store');
    return 0;
  }
  const built = buildCommand(command, args, loaded.config);
  if (built.dryRun) { console.log(formatCommand(built.args)); return 0; }
  return runShopify(built.args);
}

export async function openPath(target, { platform = process.platform } = {}) {
  const opener = platform === 'darwin' ? ['open', target]
    : platform === 'win32' ? ['cmd', '/c', 'start', '', target]
    : ['xdg-open', target];
  return new Promise((resolve, reject) => {
    const child = spawn(opener[0], opener.slice(1), { stdio: 'ignore', shell: platform === 'win32' });
    child.once('error', error => reject(new Error(error.code === 'ENOENT' ? `Could not open ${target}. Set EDITOR or open the file manually.` : error.message)));
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Could not open ${target}.`)));
  });
}

export async function runShopify(args, { platform = process.platform } = {}) {
  // Use argument arrays, never eval or a shell command string.
  // Windows npm exposes shopify.cmd; invoke the package's JS entry with Node instead.
  let executable = 'shopify';
  if (platform === 'win32') {
    const directories = (process.env.PATH || '').split(path.delimiter);
    let entry;
    for (const directory of directories) {
      const root = path.join(directory, 'node_modules', '@shopify', 'cli');
      const manifest = path.join(root, 'package.json');
      if (!fs.existsSync(manifest)) continue;
      const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.shopify;
      if (bin && fs.existsSync(path.join(root, bin))) { entry = path.join(root, bin); break; }
    }
    if (!entry) throw new Error('Shopify CLI not found. Install it globally with npm install -g @shopify/cli.');
    executable = process.execPath;
    args = [entry, ...args];
  }
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: 'inherit', shell: false });
    const forwardInterrupt = () => { if (!child.killed) child.kill('SIGINT'); };
    const forwardTerminate = () => { if (!child.killed) child.kill('SIGTERM'); };
    process.on('SIGINT', forwardInterrupt);
    process.on('SIGTERM', forwardTerminate);
    const cleanup = () => { process.off('SIGINT', forwardInterrupt); process.off('SIGTERM', forwardTerminate); };
    child.once('error', error => {
      cleanup(); reject(new Error(error.code === 'ENOENT' ? 'Shopify CLI not found. Install it with npm install -g @shopify/cli.' : error.message));
    });
    child.once('exit', (code, signal) => { cleanup(); resolve(code ?? (signal === 'SIGINT' ? 130 : 143)); });
  });
}
