import Phaser from 'phaser';
import starterArtwork from '../../../assets/pokeapi-starter-artwork-v1.json';
import { publicAssetUrl } from '../../core/assets/index.ts';

/** Stable species IDs map to atlas cells; no art lookup depends on a translated name. */
export const CREATURE_ART_GROUPS = [
  [1, 4, 7, 25],
  [16, 19, 161, 163],
  [10, 11, 12, 13],
  [14, 15, 167, 179],
  [43, 60, 69, 194],
] as const;
const starterArt = new Map(starterArtwork.artworks.map(art => [art.speciesId, art]));

// Only accepted generation outputs enter the runtime. Missing art is explicit in the UI.
const AVAILABLE_GROUPS = new Set([2, 3]);

export function creatureArtKey(speciesId: number): string | undefined {
  if (starterArt.has(speciesId)) return 'pokeapi-starter-' + speciesId + '-v1';
  const group = CREATURE_ART_GROUPS.findIndex(ids => (ids as readonly number[]).includes(speciesId));
  return !AVAILABLE_GROUPS.has(group) ? undefined : `veloria-creatures-${group + 1}-v1`;
}

export function preloadCreatureArt(scene: Phaser.Scene): void {
  for (const art of starterArt.values()) scene.load.image(creatureArtKey(art.speciesId)!, publicAssetUrl(art.path, import.meta.env.BASE_URL));
  CREATURE_ART_GROUPS.forEach((_, index) => {
    if (!AVAILABLE_GROUPS.has(index)) return;
    const key = `veloria-creatures-${index + 1}-v1`;
    scene.load.image(key, publicAssetUrl(`assets/creatures/${key}.png`, import.meta.env.BASE_URL));
  });
}

export function createCreaturePortrait(speciesId: number): HTMLElement {
  const portrait = document.createElement('span');
  portrait.className = 'creature-portrait';
  portrait.setAttribute('aria-hidden', 'true');
  const group = CREATURE_ART_GROUPS.findIndex(ids => (ids as readonly number[]).includes(speciesId));
  const singleArt = starterArt.get(speciesId);
  if (singleArt) {
    portrait.style.backgroundImage = 'url("' + publicAssetUrl(singleArt.path, import.meta.env.BASE_URL) + '")';
    portrait.style.backgroundSize = 'contain';
    portrait.style.backgroundPosition = 'center';
    portrait.style.backgroundRepeat = 'no-repeat';
  } else if (AVAILABLE_GROUPS.has(group)) {
    const index = (CREATURE_ART_GROUPS[group] as readonly number[]).indexOf(speciesId);
    portrait.style.backgroundImage = `url("${publicAssetUrl(`assets/creatures/veloria-creatures-${group + 1}-v1.png`, import.meta.env.BASE_URL)}")`;
    portrait.style.backgroundPosition = `${(index % 2) * 100}% ${Math.floor(index / 2) * 100}%`;
  } else {
    portrait.classList.add('creature-portrait-pending');
    portrait.textContent = '◈';
    portrait.title = 'Illustrazione in lavorazione';
  }
  return portrait;
}

/** Frames use the source dimensions, so the runtime never assumes the generator's resolution. */
export function createCreatureImage(scene: Phaser.Scene, speciesId: number, x: number, y: number): Phaser.GameObjects.Image | undefined {
  const key = creatureArtKey(speciesId);
  if (!key || !scene.textures.exists(key)) return undefined;
  if (starterArt.has(speciesId)) return scene.add.image(x, y, key);
  const texture = scene.textures.get(key);
  const source = texture.getSourceImage() as HTMLImageElement;
  const group = CREATURE_ART_GROUPS.find(ids => (ids as readonly number[]).includes(speciesId))!;
  const index = (group as readonly number[]).indexOf(speciesId);
  const frame = `species-${speciesId}`;
  if (!texture.has(frame)) texture.add(frame, 0, (index % 2) * source.width / 2, Math.floor(index / 2) * source.height / 2, source.width / 2, source.height / 2);
  return scene.add.image(x, y, key, frame);
}
