import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { poseStorage, report, uniqueFileBudget } from '../../tools/report_art_budget.mjs';

test('regular portrait estimates Canvas and complete WebGL mip chain separately', () => {
  const result = poseStorage(1024, 1536);
  assert.deepEqual(result.frame, { width: 340, height: 510 });
  assert.deepEqual(result.webgl, { width: 512, height: 512 });
  assert.equal(result.canvasRgbaBytes, 340 * 510 * 4);
  assert.equal(result.webglRgbaWithMipBytes, 1398100);
  assert.equal(result.sourceDecodedRgbaBytes, 1024 * 1536 * 4);
});

test('small untouched textures do not acquire invented mip levels', () => {
  const result = poseStorage(32, 64);
  assert.equal(result.webglRgbaWithMipBytes, 32 * 64 * 4);
  assert.equal(result.canvasRgbaBytes, result.webglRgbaWithMipBytes);
});

test('irregular source uses fractional frame but rounded Canvas backing', () => {
  const result = poseStorage(1064, 1478);
  assert.equal(result.frame.height, 512);
  assert.ok(result.frame.width < result.canvas.width);
  assert.deepEqual(result.canvas, { width: 369, height: 512 });
  assert.deepEqual(result.webgl, { width: 512, height: 512 });
  assert.throws(() => poseStorage(0, 512), /positive safe integers/);
});

test('file budget resolves aliases once and fails for missing files', () => {
  const root = mkdtempSync(join(tmpdir(), 'veloria-budget-'));
  try {
    writeFileSync(join(root, 'one'), '12345');
    const result = uniqueFileBudget(root, ['one', './one']);
    assert.equal(result.bytes, 5); assert.equal(result.fileCount, 1);
    assert.throws(() => uniqueFileBudget(root, ['missing']), /ENOENT/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('report deduplicates map keys and shell paths, rejects stale provenance', () => {
  const root = mkdtempSync(join(tmpdir(), 'veloria-art-report-'));
  try {
    for (const path of ['assets', 'content/maps', 'public']) mkdirSync(join(root, path), { recursive: true });
    const write = (path, value) => writeFileSync(join(root, path), JSON.stringify(value));
    const bytes = Buffer.from('pose'); writeFileSync(join(root, 'public/pose.webp'), bytes);
    const pose = { assetKey: 'pose', width: 1024, height: 1536, runtimePath: 'public/pose.webp',
      runtimeSha256: createHash('sha256').update(bytes).digest('hex') };
    write('assets/npc-idle-views-v1.json', { profiles: [{ views: [pose] }] });
    write('content/manifest.json', { contentVersion: 'fixture' });
    write('content/maps/one.map.json', { id: 'one', renderAssets: [{ key: 'pose' }, { key: 'pose' }] });
    writeFileSync(join(root, 'public/sw.js'), "const SHELL = [ './pose.webp', './pose.webp', './', './index.html', './build-manifest.json' ];");
    const result = report(root);
    assert.equal(result.maps[0].registeredIdlePoseCount, 1);
    assert.equal(result.maps[0].idleFileBytes, 4);
    assert.deepEqual(result.staticShell, { declaredEntries: 5, uniqueSourceFiles: 1, sourceFileBytes: 4 });
    writeFileSync(join(root, 'public/pose.webp'), 'changed');
    assert.throws(() => report(root), /Stale pose hash/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
