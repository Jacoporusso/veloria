/** Audit actual Playwright discovery: every non-offline case belongs to exactly one CI suite. */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = resolve(root, 'node_modules/@playwright/test/cli.js');
const names = ['chapters', 'world', 'journeys', 'mvp', 'controls', 'league', 'league-approach'];
function discover(suite) {
  const env = { ...process.env, CI: 'true' };
  delete env.VELORIA_E2E_SUITE;
  if (suite) env.VELORIA_E2E_SUITE = suite;
  const report = JSON.parse(execFileSync(process.execPath, [cli, 'test', '--list', '--reporter=json'],
    { cwd: root, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  if (report.errors?.length) throw new Error(JSON.stringify(report.errors));
  const cases = new Set();
  function visit(node, parents = []) {
    const path = node.title ? [...parents, node.title] : parents;
    for (const spec of node.specs ?? []) {
      const key = `${spec.file}:${spec.line}:${spec.column} ${[...path, spec.title].join(' > ')}`;
      if (cases.has(key)) throw new Error(`Duplicate discovered case: ${key}`);
      cases.add(key);
    }
    for (const child of node.suites ?? []) visit(child, path);
  }
  visit(report);
  return cases;
}
const baseline = discover();
const assigned = new Map();
for (const name of names) {
  const cases = discover(name);
  if (!cases.size) throw new Error(`Empty CI suite: ${name}`);
  for (const key of cases) {
    if (!baseline.has(key)) throw new Error(`Unexpected case in ${name}: ${key}`);
    if (assigned.has(key)) throw new Error(`Case in both ${assigned.get(key)} and ${name}: ${key}`);
    assigned.set(key, name);
  }
  process.stdout.write(`${name}: ${cases.size} cases\n`);
}
const missing = [...baseline].filter(key => !assigned.has(key));
if (missing.length) throw new Error(`Cases missing from CI:\n${missing.join('\n')}`);
process.stdout.write(`Verified ${baseline.size} browser cases, each assigned exactly once. Offline cases use their dedicated config.\n`);
