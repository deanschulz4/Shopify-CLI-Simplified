import { main } from './cli.js';

export async function runEntry(command, input = process.argv.slice(2)) {
  const args = [...input];
  const global = [];
  if (args[0] === '--config') global.push(...args.splice(0, 2));
  try {
    process.exitCode = await main([...global, ...(['--help', '-h', '--version'].includes(args[0]) ? args : [command, ...args])]);
  } catch (error) {
    console.error(`${command}: ${error.message}`);
    process.exitCode = 1;
  }
}
