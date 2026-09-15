import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Inspect an actual installed archive, not just the files in the working tree.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sshop-release-'));
const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const npmPath = process.env.npm_execpath;
assert.ok(npmPath, 'Run via npm run release:check');
function npm(args) {
  const result = spawnSync(process.execPath, [npmPath, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}
try {
  const [packed] = JSON.parse(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', temp]));
  const permitted = /^(?:package\.json|README\.md|LICENSE|bin\/[^/]+\.js|src\/[^/]+\.js|scripts\/postinstall\.js|shell\/shortcuts\.(?:sh|ps1)|examples\/sshop\.example\.json|docs\/RELEASING\.md)$/;
  for (const entry of packed.files) assert.ok(permitted.test(entry.path), `Unexpected packaged file: ${entry.path}`);
  assert.ok(packed.files.some(entry => entry.path === 'LICENSE'), 'License missing');
  const prefix = path.join(temp, 'install with spaces');
  npm(['install', '--global', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', path.join(temp, packed.filename)]);
  const installed = path.join(prefix, ...(process.platform === 'win32' ? [] : ['lib']), 'node_modules', ...manifest.name.split('/'));
  const token = /(?:shpat_|shpca_|shppa_|shpss_|ghp_|github_pat_|npm_)[a-zA-Z0-9_]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
  for (const entry of packed.files) {
    const content = fs.readFileSync(path.join(installed, entry.path), 'utf8');
    assert.ok(!token.test(content), `Potential credential in ${entry.path}`);
    assert.ok(!/\/Users\/[^/\s]+\//.test(content), `Personal filesystem path in ${entry.path}`);
    const stores = content.match(/[a-z0-9-]+\.myshopify\.com/gi) || [];
    for (const store of stores) assert.ok(['example-store.myshopify.com', 'example-sandbox.myshopify.com'].includes(store.toLowerCase()), `Non-example store domain in ${entry.path}`);
  }
  for (const [name, entry] of Object.entries(manifest.bin)) {
    const result = spawnSync(process.execPath, [path.join(installed, entry), '--help'], { encoding: 'utf8', cwd: temp });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    assert.match(result.stdout, /Usage:/);
  }
  const config = path.join(installed, 'examples', 'sshop.example.json');
  for (const [entry, args, pattern] of [
    ['sd', ['demo', 'Theme with spaces', '-p', '9293'], /--theme 'Theme with spaces'.*--port 9293/],
    ['sl', ['demo', '-j'], /--json/],
    ['si', ['demo', '-j'], /--json/],
    ['sp', ['demo', '-p'], /--only 'templates\/\*\.json'/],
  ]) {
    const result = spawnSync(process.execPath, [path.join(installed, manifest.bin[entry]), '--config', config, ...args, '--dry-run'], { encoding: 'utf8', cwd: temp });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, pattern);
  }
  console.log(`Release archive passed: ${packed.files.length} files, ${Object.keys(manifest.bin).length} entry points, isolated installation, secret-pattern and private-domain checks.`);
  console.log(`Archive integrity: ${packed.integrity}`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
