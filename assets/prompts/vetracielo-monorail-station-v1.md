# Stazione Giardino — Vetracielo v1

Generated 2026-10-18 with the built-in ImageGen tool, transparent background. Original architecture for Veloria; human art review pending. PNG 1536×1024 RGBA retained at `public/assets/sprites/veloria-monorail-station-v1.png`; runtime WebP q88 at the sibling `.webp` path, alpha preserved. No remote runtime dependency.

## Final prompt

Use case: stylized-concept. Create ONE original production-ready 2D illustrated game prop for Veloria, a modern children's exploration RPG. Subject: a compact futuristic garden monorail station pavilion, pearl ivory steel arches, curved cyan glass roof, warm entry lights, integrated green rooftop plants and delicate cherry-blossom planters. One short sleek white and teal monorail train rests horizontally on an elevated rail behind the pavilion, fully integrated as a single architectural silhouette. Style: crisp hand-painted modern 2D illustration, soft volumetric shading, clean readable contours, sophisticated inviting color gradients, high detail, no pixel art, no retro game framing, no text or symbols. View: orthographic RPG camera looking down at 45 degrees, FRONT facade facing camera/south, symmetric centered entrance at bottom, no isometric diagonal rotation, horizontal front edge. Entire station fully visible and isolated on genuinely transparent background, no landscape, no sky, no ground plane or square base, no characters, no UI, generous empty transparent margin. Wide 3:2 composition, render a large clear detailed prop suitable for downscaling to about 420x260 game pixels. This is a new original environmental asset, no existing franchise architecture or logos.

## Integration

Single decorative `scenery-image` in Vetracielo, shared Tiled map contract. Station and rail exclusion areas are in the collision layer. The train is scenery; no fast travel or enterable station interior is implied. Services are separate reachable terminals on the plaza.
