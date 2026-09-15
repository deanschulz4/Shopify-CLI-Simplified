import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildCommand, formatCommand } from '../src/commands.js';
import { normalizeStore, loadConfig, writeConfig, validateConfig, importAliases } from '../src/config.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const config = { version: 1, stores: { demo: 'example-store', same: 'same' }, defaults: { nodelete: true, themeEditorSync: true } };
const build = (name, args = [], settings = config) => buildCommand(name, args, settings).args;
function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sshop-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function invoke(directory, args, env = {}) {
  return spawnSync(process.execPath, [path.join(root, 'bin/sshop.js'), '--config', path.join(directory, '.sshop.json'), ...args], { cwd: directory, encoding: 'utf8', env: { ...process.env, ...env } });
}

test('aliases, prefixes, full domains, URLs and same-name aliases normalize once', () => {
  for (const value of ['example-store', 'example-store.myshopify.com', 'https://EXAMPLE-store.myshopify.com/']) assert.equal(normalizeStore(value), 'example-store.myshopify.com');
  assert.deepEqual(build('sl', ['demo']), ['theme', 'list', '--store', 'example-store.myshopify.com']);
  assert.deepEqual(build('sd', ['same', 'Theme Name']), ['theme', 'dev', '--store', 'same.myshopify.com', '--theme', 'Theme Name', '--theme-editor-sync']);
  for (const value of ['example.com', 'x.myshopify.com/path', 'x;whoami', '', '-bad', 'x.myshopify.com.myshopify.com']) assert.throws(() => normalizeStore(value));
});
test('pull defaults preserve original semantics and literal JSON patterns', () => {
  assert.deepEqual(build('sp'), ['theme', 'pull', '--live', '--nodelete']);
  assert.deepEqual(build('sp', ['demo', 'My Theme', '-p']), ['theme', 'pull', '--store', 'example-store.myshopify.com', '--theme', 'My Theme', '--nodelete', '--only', 'templates/*.json', '--only', 'config/*.json']);
  assert.deepEqual(build('spa'), ['theme', 'pull', '--live']);
  assert.deepEqual(build('spl'), ['theme', 'pull', '--live', '--nodelete', '--only', 'templates/*.json', '--only', 'config/*.json']);
  assert.deepEqual(build('pull', ['--development']), ['theme', 'pull', '--development', '--nodelete']);
});
test('explicit targeting resolves ambiguity; flags pass through as separate arguments', () => {
  assert.deepEqual(build('dev', ['--store', 'new-shop', '--theme', 'demo', '--', '--port', '9293']), ['theme', 'dev', '--store', 'new-shop.myshopify.com', '--theme', 'demo', '--theme-editor-sync', '--port', '9293']);
  assert.deepEqual(build('dev', ['Theme with spaces']), ['theme', 'dev', '--theme', 'Theme with spaces', '--theme-editor-sync']);
  assert.deepEqual(build('dev'), ['theme', 'dev', '--theme-editor-sync']);
  assert.deepEqual(build('info', ['demo', '-t', '123']), ['theme', 'info', '--store', 'example-store.myshopify.com', '--theme', '123']);
});
test('bad options and conflicting selectors fail before execution', () => {
  for (const args of [['--store'], ['--theme'], ['--bogus'], ['--live', '--development'], ['--theme', 'x', '--live'], ['a', 'b', 'c'], ['--', '--store=other']]) assert.throws(() => build('pull', args));
  assert.throws(() => build('dev', ['--live']));
  assert.throws(() => build('check', ['demo']));
  assert.throws(() => build('list', ['--theme', 'x']));
  assert.throws(() => build('dev', ['-p']));
});
test('defaults and simple commands', () => {
  const settings = { ...config, defaultStore: 'demo', defaults: { nodelete: false, themeEditorSync: false } };
  assert.deepEqual(build('dev', [], settings), ['theme', 'dev', '--store', 'example-store.myshopify.com']);
  assert.deepEqual(build('sp', [], settings), ['theme', 'pull', '--store', 'example-store.myshopify.com', '--live']);
  assert.deepEqual(build('sc', [], settings), ['theme', 'check']);
  assert.deepEqual(build('sf'), ['theme', 'check', '--auto-correct']);
  assert.deepEqual(build('lo'), ['auth', 'logout']);
});
test('list/info JSON shorthand matches passthrough and rejects unsupported use', () => {
  for (const [shortcut, command] of [['sl', 'list'], ['si', 'info']]) {
    const expected = ['theme', command, '--store', 'example-store.myshopify.com', '--json'];
    assert.deepEqual(build(shortcut, ['demo', '-j']), expected);
    assert.deepEqual(build(command, ['demo', '--json']), expected);
    assert.deepEqual(build(shortcut, ['demo', '--', '--json']), expected);
    assert.throws(() => build(shortcut, ['-j', '--json']), /more than once/);
    assert.throws(() => build(shortcut, ['-j', '--', '--json']), /more than once/);
  }
  for (const command of ['sd', 'sp', 'sc', 'lo']) assert.throws(() => build(command, ['-j']), /only to list and info/);
  assert.ok(build('sp', ['demo', '-p']).includes('templates/*.json'));
});
test('dev port shorthand validates values and leaves pull -p unchanged', () => {
  const expected = ['theme', 'dev', '--store', 'example-store.myshopify.com', '--theme-editor-sync', '--port', '9293'];
  assert.deepEqual(build('sd', ['demo', '-p', '9293']), expected);
  assert.deepEqual(build('dev', ['demo', '--port', '9293']), expected);
  assert.deepEqual(build('sd', ['demo', '--', '--port', '9293']), expected);
  assert.ok(build('sp', ['demo', '-p']).includes('templates/*.json'));
  for (const args of [['-p'], ['-p', '0'], ['-p', '65536'], ['-p', 'abc'], ['-p', '1.5'], ['-p', '9293', '--port', '9294'], ['-p', '9293', '--', '--port=9294']]) assert.throws(() => build('sd', args), /Port/);
  assert.throws(() => build('sp', ['--port', '9293']), /only to dev/);
});
test('config merges home and nearest project; explicit file is isolated', t => {
  const base = temporary(t), home = path.join(base, 'home'), project = path.join(base, 'project'), child = path.join(project, 'theme');
  fs.mkdirSync(home); fs.mkdirSync(child, { recursive: true });
  writeConfig(path.join(home, '.sshop.json'), { ...config, defaultStore: 'demo' });
  writeConfig(path.join(project, '.sshop.json'), { version: 1, stores: { demo: 'project-store' }, defaultStore: null, defaults: { nodelete: false } });
  const merged = loadConfig({ home, cwd: child, explicit: undefined });
  assert.equal(merged.config.stores.demo, 'project-store');
  assert.equal(merged.config.stores.same, 'same');
  assert.equal(merged.config.defaultStore, null);
  assert.equal(merged.config.defaults.themeEditorSync, true);
  assert.equal(merged.config.defaults.nodelete, false);
  assert.equal(merged.files.length, 2);
  const isolated = loadConfig({ home, cwd: child, explicit: '../.sshop.json' });
  assert.equal(isolated.config.stores.same, undefined);
  assert.throws(() => loadConfig({ home, cwd: child, explicit: 'missing.json' }), /ENOENT/);
});
test('malformed config is rejected and init cannot overwrite existing files', t => {
  const directory = temporary(t), file = path.join(directory, '.sshop.json');
  writeConfig(file, config, { create: true });
  assert.throws(() => writeConfig(file, config, { create: true }), /EEXIST/);
  for (const value of [{}, { ...config, defaults: { nodelete: 'yes' } }, { ...config, stores: [] }, { ...config, typo: true }, JSON.parse('{"version":1,"stores":{"__proto__":"x"}}')]) assert.throws(() => validateConfig(value));
  fs.writeFileSync(file, '{broken');
  assert.throws(() => loadConfig({ explicit: file }), /sshop.json/);
});
test('legacy import reads literal mappings without executing the file', t => {
  const directory = temporary(t), marker = path.join(directory, 'must-not-exist');
  const source = `touch '${marker}'\nmap_store() {\n case "$1" in\n demo) printf '%s' 'example-store' ;;\n demo) printf '%s' 'example-store' ;;\n *) printf '%s' "$1" ;;\n esac\n}\n`;
  assert.deepEqual(importAliases(source), { demo: 'example-store.myshopify.com' });
  assert.equal(fs.existsSync(marker), false);
  assert.throws(() => importAliases(source.replace("*) printf", "demo) printf '%s' 'different' ;;\n *) printf")), /Conflicting/);
});
test('CLI supports init, alias CRUD, import, dry-run and useful failures', t => {
  const directory = temporary(t);
  assert.equal(invoke(directory, ['init']).status, 0);
  assert.equal(invoke(directory, ['init']).status, 1);
  assert.equal(invoke(directory, ['stores', 'add', 'demo', 'example-store']).status, 0);
  assert.match(invoke(directory, ['stores']).stdout, /demo\texample-store.myshopify.com/);
  const dry = invoke(directory, ['sd', 'demo', 'My Theme', '--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /--theme 'My Theme'/);
  fs.writeFileSync(path.join(directory, 'old.sh'), "map_store() {\n new) printf '%s' 'new-shop' ;;\n}\n");
  assert.equal(invoke(directory, ['import', 'old.sh']).status, 0);
  assert.equal(invoke(directory, ['stores', 'remove', 'new']).status, 0);
  assert.equal(invoke(directory, ['stores', 'remove', 'new']).status, 1);
  assert.equal(invoke(directory, ['unknown']).status, 1);
});
test('dry-run redacts password options', () => {
  const output = formatCommand(['theme', 'dev', '--password', 'top-secret', '--store-password=also-secret']);
  assert.ok(!output.includes('top-secret') && !output.includes('also-secret'));
  assert.match(output, /redacted/);
});
test('every direct command forwards to the equivalent CLI command', t => {
  const directory = temporary(t);
  writeConfig(path.join(directory, '.sshop.json'), config);
  const commands = { sd: 'dev', sp: 'pull', sl: 'list', si: 'info', spl: 'pull-json', spa: 'pull-all', sc: 'check', sf: 'fix', lo: 'logout', sstores: 'stores', sconfig: 'config', shelp: 'help' };
  for (const [name, command] of Object.entries(commands)) {
    const options = ['sstores', 'sconfig', 'shelp'].includes(name) ? [] : ['--dry-run'];
    const result = spawnSync(process.execPath, [path.join(root, `bin/${name}.js`), '--config', path.join(directory, '.sshop.json'), ...options], { encoding: 'utf8' });
    const expected = invoke(directory, [command, ...options]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, expected.stdout, name);
  }
  for (const name of ['sinit', 'simport']) {
    const result = spawnSync(process.execPath, [path.join(root, `bin/${name}.js`), '--help'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage:/);
  }
});
test('real process dispatch preserves argv, exit codes and does not execute theme text', t => {
  const directory = temporary(t), stub = path.join(directory, 'shopify');
  writeConfig(path.join(directory, '.sshop.json'), config);
  fs.writeFileSync(stub, `#!${process.execPath}\nconsole.log(JSON.stringify(process.argv.slice(2))); process.exit(Number(process.env.STUB_EXIT || 0));\n`, { mode: 0o755 });
  const packageRoot = path.join(directory, 'node_modules', '@shopify', 'cli');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ bin: { shopify: 'run.cjs' } }));
  fs.writeFileSync(path.join(packageRoot, 'run.cjs'), 'console.log(JSON.stringify(process.argv.slice(2))); process.exit(Number(process.env.STUB_EXIT || 0));');
  const name = 'Theme "quoted"; $(touch injected)';
  const result = invoke(directory, ['sd', 'demo', name], { PATH: `${directory}${path.delimiter}${process.env.PATH}`, STUB_EXIT: '7' });
  assert.equal(result.status, 7, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ['theme', 'dev', '--store', 'example-store.myshopify.com', '--theme', name, '--theme-editor-sync']);
  assert.equal(fs.existsSync(path.join(directory, 'injected')), false);
});
test('Windows launch path runs npm package entry with spaces and preserves literal arguments', t => {
  const directory = temporary(t), prefix = path.join(directory, 'npm prefix with spaces');
  const packageRoot = path.join(prefix, 'node_modules', '@shopify', 'cli');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'entry.cjs'), 'console.log(JSON.stringify(process.argv.slice(2))); process.exit(9);');
  const args = ['theme', 'dev', '--theme', 'Theme "quoted" & %PATH% $HOME; $(touch injected)', '--path', 'C:\\Users\\Example User\\Theme'];
  const moduleUrl = pathToFileURL(path.join(root, 'src/cli.js')).href;
  const script = `import { runShopify } from ${JSON.stringify(moduleUrl)}; process.exitCode = await runShopify(${JSON.stringify(args)}, { platform: 'win32' });`;
  for (const bin of [{ shopify: 'entry.cjs' }, 'entry.cjs']) {
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ bin }));
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: directory, encoding: 'utf8', env: { ...process.env, PATH: prefix } });
    assert.equal(result.status, 9, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), args);
    assert.equal(fs.existsSync(path.join(directory, 'injected')), false);
  }
});
test('Windows launch path reports missing Shopify installation clearly', t => {
  const directory = temporary(t);
  const moduleUrl = pathToFileURL(path.join(root, 'src/cli.js')).href;
  const script = `import { runShopify } from ${JSON.stringify(moduleUrl)}; try { await runShopify(['theme', 'list'], { platform: 'win32' }); } catch (error) { console.error(error.message); process.exitCode = 1; }`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', env: { ...process.env, PATH: directory } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Shopify CLI not found/);
});
test('Bash and Zsh shortcuts forward quoted arguments', { skip: process.platform === 'win32' }, t => {
  const directory = temporary(t);
  fs.writeFileSync(path.join(directory, 'sd'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 });
  for (const shell of ['bash', 'zsh']) {
    const available = spawnSync(shell, ['--version']);
    if (available.error?.code === 'ENOENT') continue;
    const result = spawnSync(shell, ['-c', 'source "$1"; sd demo "Theme Name"', 'test', path.join(root, 'shell/shortcuts.sh')], { encoding: 'utf8', env: { ...process.env, PATH: `${directory}${path.delimiter}${process.env.PATH}` } });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'demo\nTheme Name\n');
  }
});


test('shell setup via eval replaces existing aliases before defining functions', t => {
  const directory = temporary(t);
  fs.writeFileSync(path.join(directory, 'spl'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 });
  for (const shell of ['bash', 'zsh']) {
    if (spawnSync(shell, ['--version']).error?.code === 'ENOENT') continue;
    const result = spawnSync(shell, ['-c', `alias spl="echo OLD"; eval "$(cat "$1")"; eval 'spl demo "Theme Name"'`, 'test', path.join(root, 'shell/shortcuts.sh')], { encoding: 'utf8', env: { ...process.env, PATH: `${directory}${path.delimiter}${process.env.PATH}` } });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'demo\nTheme Name\n');
  }
});


test('development shorthand supports pull and info, and store omission preserves Shopify context', () => {
  for (const cmd of ['sp', 'spl', 'spa', 'si']) {
    assert.deepEqual(build(cmd, ['-d']), build(cmd, ['--development']));
    assert.ok(build(cmd, ['-d']).includes('--development'));
    assert.ok(!build(cmd, ['-d']).includes('--store'));
  }
  assert.deepEqual(build('si', ['-d', '-j']), ['theme', 'info', '--development', '--json']);
  assert.deepEqual(build('sd', ['My Theme']), ['theme', 'dev', '--theme', 'My Theme', '--theme-editor-sync']);
  assert.throws(() => build('sp', ['-d', '--live']), /only one/);
  assert.throws(() => build('sp', ['-d', '--development']), /only one/);
  assert.throws(() => build('si', ['-d', '-t', '123']), /either/);
  assert.throws(() => build('sd', ['-d']), /applies/);
});

test('global shorthand writes only the selected personal configuration', t => {
  const home = temporary(t), cwd = path.join(home, 'project');
  fs.mkdirSync(cwd);
  const run = args => spawnSync(process.execPath, [path.join(root, 'bin/sshop.js'), ...args], { cwd, encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home, SSHOP_CONFIG: '' } });
  assert.equal(run(['init', '-g']).status, 0);
  assert.equal(run(['stores', 'add', 'demo', 'example-store', '-g']).status, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(home, '.sshop.json'))).stores.demo, 'example-store.myshopify.com');
  assert.equal(fs.existsSync(path.join(cwd, '.sshop.json')), false);
  fs.writeFileSync(path.join(cwd, 'legacy.sh'), "map_store() {\n other) printf '%s' 'other-shop' ;;\n}\n");
  assert.equal(run(['import', 'legacy.sh', '-g']).status, 0);
  assert.equal(run(['stores', 'remove', 'other', '-g']).status, 0);
  assert.equal(run(['init', '-g', '--global']).status, 1);
  assert.equal(run(['--config', 'custom.json', 'init', '-g']).status, 1);
});
