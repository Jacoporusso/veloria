/** Reproducible file sizes and modeled NPC texture storage; never a device-memory measurement. */
import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { npcIdleTextureSize } from '../src/game/rendering/npc-idle-texture-size.ts';

export function poseStorage(width, height) {
  const frame = npcIdleTextureSize(width, height);
  const resized = frame.width !== width || frame.height !== height;
  const canvas = { width: Math.ceil(frame.width), height: Math.ceil(frame.height) };
  const webgl = resized ? { width: 2 ** Math.ceil(Math.log2(frame.width)), height: 2 ** Math.ceil(Math.log2(frame.height)) } : canvas;
  let mipBytes = 0;
  for (let w = webgl.width, h = webgl.height; ; w = Math.max(1, Math.floor(w / 2)), h = Math.max(1, Math.floor(h / 2))) {
    mipBytes += w * h * 4;
    if (!resized || (w === 1 && h === 1)) break;
  }
  return { frame, canvas, webgl, sourceDecodedRgbaBytes: width * height * 4,
    canvasRgbaBytes: canvas.width * canvas.height * 4, webglRgbaWithMipBytes: mipBytes };
}

export function uniqueFileBudget(root, paths) {
  const unique = [...new Set(paths.map(path => resolve(root, path)))].sort();
  const files = unique.map(path => ({ path: relative(root, path).replaceAll('\\', '/'), bytes: statSync(path).size }));
  return { fileCount: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0), files };
}

export function report(root) {
  const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  const manifestPath = 'assets/npc-idle-views-v1.json';
  const poses = json(manifestPath).profiles.flatMap(profile => profile.views);
  const seen = new Set();
  for (const pose of poses) {
    if (seen.has(pose.assetKey)) throw new Error(`Duplicate pose key: ${pose.assetKey}`);
    seen.add(pose.assetKey);
    const bytes = readFileSync(resolve(root, pose.runtimePath));
    if (createHash('sha256').update(bytes).digest('hex') !== pose.runtimeSha256) throw new Error(`Stale pose hash: ${pose.assetKey}`);
  }
  const byKey = new Map(poses.map(pose => [pose.assetKey, pose]));
  const maps = readdirSync(resolve(root, 'content/maps')).filter(name => name.endsWith('.map.json')).sort().map(name => {
    const path = `content/maps/${name}`;
    const map = json(path);
    const keys = [...new Set(map.renderAssets.map(asset => asset.key))].filter(key => byKey.has(key));
    const totals = keys.map(key => poseStorage(byKey.get(key).width, byKey.get(key).height));
    return { mapId: map.id, registeredIdlePoseCount: keys.length,
      idleFileBytes: keys.reduce((sum, key) => sum + statSync(resolve(root, byKey.get(key).runtimePath)).size, 0),
      modeledCanvasRgbaBytes: totals.reduce((sum, item) => sum + item.canvasRgbaBytes, 0),
      modeledWebglRgbaWithMipBytes: totals.reduce((sum, item) => sum + item.webglRgbaWithMipBytes, 0) };
  });
  const sw = readFileSync(resolve(root, 'public/sw.js'), 'utf8');
  const shell = sw.split('const SHELL = [', 2)[1]?.split('];', 1)[0];
  if (!shell) throw new Error('Static SHELL array not found');
  const shellPaths = [...shell.matchAll(/'\.\/([^']*)'/g)].map(match => `public/${match[1]}`);
  const existingStatic = shellPaths.filter(path => !['public/', 'public/index.html', 'public/build-manifest.json'].includes(path));
  const shellBudget = uniqueFileBudget(root, existingStatic);
  const idleBudget = uniqueFileBudget(root, poses.map(pose => pose.runtimePath));
  return { schemaVersion: 1, contentVersion: json('content/manifest.json').contentVersion,
    limitations: ['File bytes are uncompressed repository bytes, not HTTP transfer or Cache Storage usage.',
      'Static SHELL source byte subtotal excludes root navigation, build-generated index.html/build-manifest.json, discovered HTML assets and build-manifest dependencies.',
      'Texture numbers model all registered idle poses per map as RGBA8; they do not measure residency, driver overhead, decode peaks, scenery, avatars, battle assets or physical-device memory.',
      'Canvas and WebGL estimates are alternatives. Source decoded bytes must not be added as permanently resident storage.'],
    idleProfiles: json(manifestPath).profiles.length, idlePoseFiles: idleBudget.fileCount, idleFileBytes: idleBudget.bytes,
    largestIdleFiles: idleBudget.files.sort((a, b) => b.bytes - a.bytes).slice(0, 10),
    staticShell: { declaredEntries: shellPaths.length, uniqueSourceFiles: shellBudget.fileCount, sourceFileBytes: shellBudget.bytes },
    maps: maps.sort((a, b) => b.modeledWebglRgbaWithMipBytes - a.modeledWebglRgbaWithMipBytes || a.mapId.localeCompare(b.mapId)) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const result = JSON.stringify(report(root), null, 2) + '\n';
  if (process.argv.length === 4 && process.argv[2] === '--output') writeFileSync(resolve(process.argv[3]), result);
  else if (process.argv.length === 2) process.stdout.write(result);
  else throw new Error('Usage: node --experimental-strip-types tools/report_art_budget.mjs [--output report.json]');
}
