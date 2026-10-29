import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cli = resolve('node_modules/@playwright/test/cli.js');
function discover(extra = []) {
  const report = JSON.parse(execFileSync(process.execPath, [cli, 'test', '--config=playwright.offline.config.ts',
    'tests/e2e/offline.spec.ts', 'tests/e2e/gen1-offline.spec.ts',
    '--workers=1', '--list', '--reporter=json', ...extra], { env: { ...process.env, CI: 'true' }, encoding: 'utf8' }));
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
// Audit the filters that CI actually runs so matrix changes cannot silently
// diverge from the coverage check. Listing tests starts no browser or server.
const offlineJob = readFileSync('.github/workflows/verify.yml', 'utf8').split(/^  offline:\s*$/m)[1];
if (!offlineJob || !/run: npm run test:e2e:offline -- --workers=1 \$\{\{ matrix\.filter \}\}/.test(offlineJob)) {
  throw new Error('Offline CI must run one worker with the audited matrix filter');
}
const entries = [...offlineJob.matchAll(/^          - suite: (\S+)\r?\n            filter: (.+)$/gm)]
  .map(([, suite, filter]) => ({ suite, filter: filter.trim() }));
const resources = entries.filter(entry => entry.suite.startsWith('resources-'));
const journey = entries.filter(entry => entry.suite === 'journey');
if (journey.length !== 1 || journey[0].filter !== '--grep=E2E-06' || entries.length !== resources.length + 1 || !resources.length) {
  throw new Error('Offline CI must contain one journey and the resource shards');
}
resources.forEach((entry, index) => {
  if (entry.suite !== `resources-${index + 1}` || entry.filter !== `--grep-invert=E2E-06 --shard=${index + 1}/${resources.length}`) {
    throw new Error(`Invalid offline resource shard: ${entry.suite} ${entry.filter}`);
  }
});
const baseline = discover();
const shards = resources.map(entry => discover(entry.filter.split(/\s+/)));
const journeyCases = discover(journey[0].filter.split(/\s+/));
const combined = [...journeyCases, ...shards.flat()];
if (!baseline.length || journeyCases.length !== 1 || shards.some(shard => !shard.length) || new Set(combined).size !== combined.length ||
    JSON.stringify([...baseline].sort()) !== JSON.stringify([...combined].sort())) throw new Error('Offline shard coverage mismatch');
console.log(`Verified ${baseline.length} offline cases exactly once: ${journeyCases.length} journey + ${shards.flat().length} resources across shards ${shards.map(shard => shard.length).join(' + ')}; one worker per runner.`);
