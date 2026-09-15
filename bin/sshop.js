#!/usr/bin/env node
import { main } from '../src/cli.js';
try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  console.error(`sshop: ${error.message}`);
  process.exitCode = 1;
}
