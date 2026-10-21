export function battleCommandLayout(width: number, height: number) {
  const landscape = height < 600 && width > height;
  const navigationHeight = 64;
  const deckWidth = landscape ? Math.max(300, Math.round(width * .44)) : width;
  const deckHeight = landscape ? height - navigationHeight : Math.min(232, Math.round(height * .4));
  return {
    landscape,
    arena: { x: 0, y: 0, width: landscape ? width - deckWidth : width, height: landscape ? height - navigationHeight : height - deckHeight - navigationHeight },
    deck: { x: landscape ? width - deckWidth : 0, y: landscape ? 0 : height - deckHeight - navigationHeight, width: deckWidth, height: deckHeight },
    navigation: { x: 0, y: height - navigationHeight, width, height: navigationHeight },
  };
}
