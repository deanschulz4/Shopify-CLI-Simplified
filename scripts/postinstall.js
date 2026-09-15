#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { filename, writeConfig } from '../src/config.js';

const file = path.join(os.homedir(), filename);
if (!fs.existsSync(file)) {
  writeConfig(file, { version: 1, stores: {}, defaults: { nodelete: true, themeEditorSync: true } }, { create: true });
  console.log(`Created ${file}`);
}
