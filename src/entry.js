import { main } from './cli.js';

function usesGlobalStoresConfig(command, args) {
  return command === 'stores' && ['add', 'remove', '.'].includes(args[0]);
}

export async function runEntry(command, input = process.argv.slice(2)) {
  const args = [...input];
  const global = [];
  if (args[0] === '--config') global.push(...args.splice(0, 2));
  if (usesGlobalStoresConfig(command, args) && !global.length && !args.some(arg => arg === '-g' || arg === '--global')) {
    args.push('-g');
  }
  try {
    process.exitCode = await main([...global, ...(['--help', '-h', '--version'].includes(args[0]) ? args : [command, ...args])]);
  } catch (error) {
    console.error(`${command}: ${error.message}`);
    process.exitCode = 1;
  }
}
