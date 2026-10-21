export function battleCommandLayout(width: number, height: number) {
  const landscape = height < 600 && width > height;
  const navigationHeight = 64;
  const deckWidth = landscape ? Math.max(300, Math.round(width * .44)) : width;
  const deckHeight = landscape ? height - navigationHeight : Math.min(232, Math.round(height * .4));
  const arenaHeight = landscape ? height - navigationHeight : height - deckHeight - navigationHeight;
  const arenaWidth = landscape ? width - deckWidth : width;
  return {
    landscape,
    arena: { x: 0, y: 0, width: arenaWidth, height: arenaHeight },
    message: { x: 12, y: Math.max(108, arenaHeight - 172), width: arenaWidth - 24, height: 61 },
    deck: { x: landscape ? width - deckWidth : 0, y: landscape ? 0 : height - deckHeight - navigationHeight, width: deckWidth, height: deckHeight },
    navigation: { x: 0, y: height - navigationHeight, width, height: navigationHeight },
  };
}

export function battleMoveGrid(deck: { x: number; y: number; width: number; height: number }) {
  const gap = 8, columns = 2;
  const width = (deck.width - 24 - gap) / columns;
  const height = Math.min(100, (deck.height - 42) / 2);
  const x = deck.x + 12, y = deck.y + 10 + Math.max(0, (deck.height - 230) / 2);
  return { gap, columns, width, height, x, y,
    card: (index: number) => ({ x: x + (index % columns) * (width + gap), y: y + Math.floor(index / columns) * (height + gap), width, height }),
  };
}
