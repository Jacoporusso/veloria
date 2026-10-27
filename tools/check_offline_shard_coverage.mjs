import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const cli = resolve('node_modules/@playwright/test/cli.js');
function discover(extra = []) {
  const report = JSON.parse(execFileSync(process.execPath, [cli, 'test', '--config=playwright.offline.config.ts',
    'tests/e2e/offline.spec.ts', 'tests/e2e/gen1-offline.spec.ts', '--grep-invert=E2E-06',
    '--list', '--reporter=json', ...extra], { env: { ...process.env, CI: 'true' }, encoding: 'utf8' }));
  if (report.errors?.length) throw new Error(JSON.stringify(report.errors));
  const cases = [];
  function visit(suite, parents = []) {
    const path = [...parents, suite.title];
    for (const spec of suite.specs ?? []) cases.push(JSON.stringify([spec.file, spec.line, ...path, spec.title]));
    for (const child of suite.suites ?? []) visit(child, path);
  }
  for (const suite of report.suites) visit(suite);
  return cases;
}
const baseline = discover();
const shards = [discover(['--shard=1/2']), discover(['--shard=2/2'])];
const combined = shards.flat();
if (!baseline.length || shards.some(shard => !shard.length) || new Set(combined).size !== combined.length ||
    JSON.stringify([...baseline].sort()) !== JSON.stringify([...combined].sort())) throw new Error('Offline shard coverage mismatch');
console.log(`Verified ${baseline.length} offline resource cases, exactly once across shards ${shards.map(shard => shard.length).join(' + ')}.`);
