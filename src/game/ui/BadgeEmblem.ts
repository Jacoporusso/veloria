import badgeContent from '../../../content/badges/badges.v1.json';
import '../../battle-celebration.css';
export const badgeCatalog: Readonly<Record<string, { name: string; leader: string; location: string; description: string; emblem?: string }>> = badgeContent.badges;

/** Original UI emblem, shared by the award banner and the persistent medal case. */
export function createBadgeEmblem(badgeId = 'badge_aurora'): HTMLElement {
  const emblem = document.createElement('span');
  emblem.className = 'badge-emblem';
  emblem.setAttribute('aria-hidden', 'true');
  emblem.dataset.badgeId = badgeId;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  const corolla = badgeCatalog[badgeId]?.emblem === 'corolla';
  const circuit = badgeCatalog[badgeId]?.emblem === 'circuit';
  const magnet = badgeCatalog[badgeId]?.emblem === 'magnet';
  const shapes: Array<[string, Record<string, string>]> = [
    ['path', { d: 'M60 5 107 32 107 88 60 115 13 88 13 32Z', fill: '#203b59', stroke: '#aeece3', 'stroke-width': '3' }],
    ['path', { d: 'M60 17 96 38 96 81 60 102 24 81 24 38Z', fill: corolla ? '#4f7370' : '#56799c', stroke: corolla ? '#ffcbdc' : '#c6b1ff', 'stroke-width': '2' }],
  ];
  if (corolla) {
    for (let angle = 0; angle < 360; angle += 72) shapes.push(['ellipse', {cx:'60',cy:'42',rx:'11',ry:'20',fill: angle % 144 ? '#ffafc5' : '#ffe1e7',transform:`rotate(${angle} 60 60)`}]);
    shapes.push(['circle',{cx:'60',cy:'60',r:'10',fill:'#ffe5a0'}],['path',{d:'M42 88Q60 68 79 87Q61 103 42 88',fill:'#aeece3'}]);
  } else if (circuit) shapes.push(
    ['path', {d:'M38 38H52V51H70V31M38 82V67H52M82 82V61H71',fill:'none',stroke:'#79cfff','stroke-width':'5','stroke-linecap':'round','stroke-linejoin':'round'}],
    ['circle',{cx:'38',cy:'38',r:'5',fill:'#afffe3'}],
    ['circle',{cx:'70',cy:'31',r:'5',fill:'#c6b1ff'}],
    ['circle',{cx:'38',cy:'82',r:'5',fill:'#c6b1ff'}],
    ['circle',{cx:'82',cy:'82',r:'5',fill:'#afffe3'}],
    ['path',{d:'M65 42 48 65H60L55 84 76 57H63Z',fill:'#fff0ac',stroke:'#fff7dc','stroke-width':'1.5'}],
  ); else if (magnet) shapes.push(
    ['path', {d:'M34 32H49V65A11 11 0 0 0 71 65V32H86V65A26 26 0 0 1 34 65Z',fill:'#d8e9ef',stroke:'#f4fcff','stroke-width':'2'}],
    ['path', {d:'M34 32H49V47H34Z',fill:'#79cfff'}],
    ['path', {d:'M71 32H86V47H71Z',fill:'#c6b1ff'}],
    ['path', {d:'M52 32Q60 22 68 32M53 43Q60 35 67 43',fill:'none',stroke:'#afffe3','stroke-width':'3','stroke-linecap':'round'}],
  ); else shapes.push(
    ['path', { d: 'M35 76 60 29 85 76 60 64Z', fill: '#afffe3' }],
    ['path', { d: 'M60 29 85 76 60 64Z', fill: '#c6b1ff' }],
    ['path', { d: 'M34 85 60 73 86 85 60 95Z', fill: '#ffe6a5' }],
    ['circle', { cx: '60', cy: '50', r: '7', fill: '#ffffff' }],
  );
  for (const [tag, attributes] of shapes) {
    const shape = document.createElementNS(ns, tag);
    for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, String(value));
    svg.append(shape);
  }
  emblem.append(svg);
  return emblem;
}
