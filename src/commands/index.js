import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cache = null;

export async function loadCommands() {
  if (cache) return cache;
  const files = readdirSync(__dirname).filter((f) => f.endsWith('.js') && f !== 'index.js');
  const commands = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(__dirname, file)).href);
    if (mod.name) commands.push(mod);
  }
  cache = commands;
  return commands;
}

export async function findCommand(trigger) {
  const commands = await loadCommands();
  const key = trigger.toLowerCase();
  return commands.find((c) => c.name === key || (c.aliases || []).includes(key));
}
