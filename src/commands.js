import { normalizeStore } from './config.js';

const names = { sl: 'list', si: 'info', sp: 'pull', sd: 'dev', spl: 'pull-json', spa: 'pull-all', sc: 'check', sf: 'fix', lo: 'logout' };
export function buildCommand(name, input, config) {
  const command = names[name] || name;
  if (!['list', 'info', 'pull', 'dev', 'pull-json', 'pull-all', 'check', 'fix', 'logout'].includes(command)) throw new Error(`Unknown command: ${name}. Run sshop --help.`);
  const separator = input.indexOf('--');
  const args = separator < 0 ? input : input.slice(0, separator);
  const extra = separator < 0 ? [] : input.slice(separator + 1);
  const positionals = [];
  let store, theme, selector, json = command === 'pull-json';
  let dryRun = false, port, jsonOutput = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') { dryRun = true; continue; }
    if (arg === '-j' || arg === '--json') {
      if (!['list', 'info'].includes(command)) throw new Error('--json/-j applies only to list and info. For JSON-only pulls, use -p.');
      if (jsonOutput) throw new Error('JSON output specified more than once.');
      jsonOutput = true;
      continue;
    }
    if (arg === '--port' || (arg === '-p' && command === 'dev')) {
      if (command !== 'dev') throw new Error('--port applies only to dev.');
      if (port !== undefined) throw new Error('Port specified more than once.');
      port = args[++i];
      if (!port || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Port must be a number from 1 to 65535. Example: sd demo -p 9293');
      continue;
    }
    if (arg === '-p' || arg === '--json-only') { json = true; continue; }
    if (arg === '--live' || arg === '--development' || arg === '-d') {
      if (selector) throw new Error('Choose only one of --live or --development.');
      selector = arg === '-d' ? '--development' : arg; continue;
    }
    if (['--store', '-s', '--theme', '-t'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('-')) throw new Error(`Missing value for ${arg}.`);
      if (arg === '--store' || arg === '-s') {
        if (store !== undefined) throw new Error('Store specified more than once.');
        store = value;
      } else {
        if (theme !== undefined) throw new Error('Theme specified more than once.');
        theme = value;
      }
      continue;
    }
    if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}. Put additional Shopify flags after --.`);
    positionals.push(arg);
  }
  const pull = ['pull', 'pull-json', 'pull-all'].includes(command);
  const thematic = pull || command === 'dev';
  if (command === 'list' || command === 'info') {
    if (positionals.length > 1 || (store && positionals.length)) throw new Error('Provide a single store.');
    store ??= positionals.shift();
  } else if (thematic) {
    if (!store && positionals.length && (positionals.length > 1 || Object.hasOwn(config.stores, positionals[0]) || /[./]/.test(positionals[0]))) store = positionals.shift();
    if (positionals.length > 1 || (theme && positionals.length)) throw new Error('Use [store] [theme], or explicit --store and --theme.');
    theme ??= positionals.shift();
  } else if (positionals.length || store || theme || selector || json) {
    throw new Error(`${command} does not accept store, theme, or pull options.`);
  }
  if (json && !pull) throw new Error('--json-only applies only to pull.');
  if (selector && !pull && !(command === 'info' && selector === '--development')) throw new Error('--live applies only to pull; --development/-d applies to pull and info.');
  if (theme && selector) throw new Error('Use either --theme or a theme selector, not both.');
  if (theme && !thematic && command !== 'info') throw new Error(`${command} does not accept a theme.`);
  store ??= config.defaultStore;
  const output = command === 'logout' ? ['auth', 'logout'] : ['theme', command === 'fix' ? 'check' : pull ? 'pull' : command];
  if (store && (thematic || ['list', 'info'].includes(command))) output.push('--store', normalizeStore(Object.hasOwn(config.stores, store) ? config.stores[store] : store));
  if (theme) output.push('--theme', theme);
  if (pull) {
    if (!theme) output.push(selector || '--live');
    if (command !== 'pull-all' && config.defaults.nodelete !== false) output.push('--nodelete');
    if (json) output.push('--only', 'templates/*.json', '--only', 'config/*.json');
  }
  if (command === 'info' && selector) output.push(selector);
  if (command === 'dev' && config.defaults.themeEditorSync !== false) output.push('--theme-editor-sync');
  if (port !== undefined) {
    if (extra.some(arg => arg === '--port' || arg.startsWith('--port='))) throw new Error('Port specified more than once.');
    output.push('--port', port);
  }
  if (command === 'fix') output.push('--auto-correct');
  if (jsonOutput) {
    if (extra.some(arg => arg === '-j' || arg === '--json' || arg.startsWith('--json='))) throw new Error('JSON output specified more than once.');
    output.push('--json');
  }
  // Prevent ambiguous duplicate targeting and accidental reinterpretation of wrapper defaults.
  const reserved = /^(?:--(?:store|theme|live|development|nodelete|theme-editor-sync)|-[stldn])(?:=|$)/;
  if (extra.some(arg => reserved.test(arg) || /^-[st].+/.test(arg))) throw new Error('Pass store/theme/selector options before --; set nodelete and themeEditorSync in config.');
  return { args: [...output, ...extra], dryRun };
}

export function formatCommand(args) {
  const redacted = [];
  let secret = false;
  for (const arg of args) {
    if (secret) { redacted.push('[redacted]'); secret = false; continue; }
    if (/^--(?:password|store-password)=/.test(arg)) { redacted.push(`${arg.split('=')[0]}=[redacted]`); continue; }
    redacted.push(arg);
    secret = ['--password', '--store-password'].includes(arg);
  }
  return ['shopify', ...redacted].map(arg => /^[a-zA-Z0-9_./:-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`).join(' ');
}
