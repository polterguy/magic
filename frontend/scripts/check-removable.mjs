/*
 * Proves that every feature can be pulled out: for each folder in src/features/, a copy of the
 * frontend without that folder must typecheck, build and pass its tests.
 *
 *   npm run check:removable                  every feature
 *   npm run check:removable -- log plugins   only these
 *   npm run check:removable -- --no-tests    typecheck and build only, much faster
 *
 * Each copy lives in the system temp folder and shares this folder's node_modules.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const withTests = !args.includes('--no-tests');
const all = fs
  .readdirSync(path.join(root, 'src/features'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);
const asked = args.filter(arg => !arg.startsWith('--'));
const unknown = asked.filter(id => !all.includes(id));
if (unknown.length > 0) {
  console.error(`No such feature: ${unknown.join(', ')}. Features: ${all.join(', ')}`);
  process.exit(2);
}
const ids = asked.length > 0 ? asked : all;

// Everything the build and the tests read, minus outputs and the dependencies.
const SKIP = new Set(['node_modules', 'dist', 'coverage', '.husky', 'tsconfig.tsbuildinfo']);

function run(cwd, command, commandArgs) {
  const result = spawnSync(command, commandArgs, { cwd, encoding: 'utf8', shell: false });
  return { ok: result.status === 0, output: (result.stdout ?? '') + (result.stderr ?? '') };
}

const steps = [
  ['typecheck', 'npx', ['tsc', '--noEmit']],
  ['build', 'npx', ['vite', 'build', '--logLevel', 'error']],
  ...(withTests ? [['tests', 'npx', ['vitest', 'run', '--reporter', 'dot']]] : []),
];

const failures = [];
for (const id of ids) {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), `without-${id}-`));
  try {
    for (const entry of fs.readdirSync(root)) {
      if (!SKIP.has(entry)) {
        fs.cpSync(path.join(root, entry), path.join(copy, entry), { recursive: true });
      }
    }
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), 'dir');
    fs.rmSync(path.join(copy, 'src/features', id), { recursive: true });

    const results = [];
    for (const [name, command, commandArgs] of steps) {
      const { ok, output } = run(copy, command, commandArgs);
      results.push(`${name} ${ok ? 'ok' : 'FAILED'}`);
      if (!ok) {
        failures.push({ id, step: name, output });
        break;
      }
    }
    console.log(`without ${id.padEnd(14)} ${results.join(', ')}`);
  } finally {
    fs.rmSync(copy, { recursive: true, force: true });
  }
}

// The failing tests or type errors first, then the end of the output for context.
for (const { id, step, output } of failures) {
  const lines = output.trim().split('\n');
  const headline = lines.filter(line => /^\s*FAIL\s|error TS\d+|\berror\b.*\[/.test(line));
  console.error(`\n--- without ${id}: ${step} failed ---`);
  console.error([...new Set(headline)].join('\n'));
  console.error(lines.slice(-25).join('\n'));
}
process.exit(failures.length > 0 ? 1 : 0);
