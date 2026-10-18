export interface ScreenRect { x: number; y: number; width: number; height: number }

export function overlaps(a: ScreenRect, b: ScreenRect, gap = 0): boolean {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}

/** Keep the label close to its visible target without covering the HUD or controls. */
export function placeGuidance(target: ScreenRect, size: { width: number; height: number }, viewport: { width: number; height: number }, obstacles: readonly ScreenRect[]): ScreenRect | undefined {
  if (!overlaps(target, { x: 0, y: 0, width: viewport.width, height: viewport.height })) return;
  const centerX = target.x + target.width / 2;
  const centerY = target.y + target.height / 2;
  const candidates = [
    { x: centerX - size.width / 2, y: target.y - size.height - 12 },
    { x: centerX - size.width / 2, y: target.y + target.height + 12 },
    { x: target.x - size.width - 12, y: centerY - size.height / 2 },
    { x: target.x + target.width + 12, y: centerY - size.height / 2 },
  ];
  for (let distance = 24; distance <= 192; distance += 24) {
    candidates.push({ x: centerX - size.width / 2, y: target.y + target.height + 12 + distance });
    candidates.push({ x: centerX - size.width / 2, y: target.y - size.height - 12 - distance });
  }
  for (const point of candidates) {
    const candidate = {
      x: Math.max(8, Math.min(viewport.width - size.width - 8, point.x)),
      y: Math.max(8, Math.min(viewport.height - size.height - 8, point.y)),
      ...size,
    };
    if (candidate.x + size.width > viewport.width - 8 || candidate.y + size.height > viewport.height - 8) continue;
    if (!overlaps(candidate, target, 6) && !obstacles.some(obstacle => overlaps(candidate, obstacle, 8))) return candidate;
  }
}
