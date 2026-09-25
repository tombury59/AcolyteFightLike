/**
 * Bibliothèque d'icônes des sorts.
 *
 * Chaque entrée est le CONTENU interne d'un SVG (chemins) dessiné dans un
 * `viewBox="0 0 24 24"`. Les sorts n'ont qu'à référencer `icons.<id>` pour leur
 * champ `icon` — la définition SVG vit ici, en un seul endroit.
 */
export const icons = {
  fireball:
    '<path d="M12 2c1.2 3.6 4.8 4.8 4.8 8.6a4.8 4.8 0 1 1-9.6 0c0-1.7.9-2.9 1.9-3.9.1 1.8 1 2.8 2 2.8.2-2.8-.9-4-1.1-7.5z"/>',
  bolt: '<path d="M3 11h13l-4-4h3l6 5-6 5h-3l4-4H3z"/>',
  laser: '<path d="M2 11h14l-3-3h3l5 4-5 4h-3l3-3H2z"/>',
  arc: '<path d="M4 13a8 8 0 0116 0h-3a5 5 0 00-10 0z"/>',
  grapple: '<path d="M11 2h2v6h2a3 3 0 013 3v5a3 3 0 11-2 0v-5a1 1 0 00-1-1h-2v3h-2V2z"/>',
  dash: '<path d="M3 12l7-6v4h5V6l6 6-6 6v-4h-5v4z"/>',
  teleport:
    '<path fill-rule="evenodd" d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 4.2a4.8 4.8 0 110 9.6 4.8 4.8 0 010-9.6z"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5z"/>',
  meteor: '<path d="M14 3l3 3-2 2 3 3-4 1-1 4-3-3-2 2-3-3 8-8zM6 15l3 3-5 2z"/>',
  homing: '<path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/>',
  drain: '<path d="M12 3s6 6 6 10a6 6 0 11-12 0c0-4 6-10 6-10z"/>',
  boomerang: '<path d="M12 3a9 9 0 106.5 15.3l-2.2-2A6 6 0 1112 6z"/>',
  whirlwind:
    '<path d="M12 2a10 10 0 00-9 6h9a2 2 0 110 4H2a10 10 0 009 6 6 6 0 010-12 6 6 0 000-4z"/>',
  scourge: '<path d="M12 2l2 6 6-2-4 5 4 5-6-2-2 6-2-6-6 2 4-5-4-5 6 2z"/>',
  supernova:
    '<path d="M12 1l2.5 6.5L21 5l-3.5 6.5L23 14l-7 .5L14 22l-2-6-4 5 1-6-6 1 5-4-6-2 6.5-2L9 3l3 4z"/>',
  gravity:
    '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a5 5 0 110 10 5 5 0 010-10zm0 3a2 2 0 100 4 2 2 0 000-4z"/>',
  bouncer:
    '<path d="M12 3a4 4 0 100 8 4 4 0 000-8zM5 19a3 3 0 100-2 3 3 0 000 2zm14 0a3 3 0 100-2 3 3 0 000 2z"/>',
  link: '<path d="M8 8h3v2H8a2 2 0 100 4h3v2H8a4 4 0 010-8zm5 0h3a4 4 0 010 8h-3v-2h3a2 2 0 100-4h-3zM8 11h8v2H8z"/>',
  triplet:
    '<path d="M4 6l6 3-6 3zM4 14l6 3-6 3zM11 9l6 3-6 3z" opacity=".55"/><path d="M4 6l7 5-7 5V6zm7 3l6 3-6 3V9z"/>',
  flamestrike:
    '<path d="M12 2c1.4 3 4 4.2 4 7.5a4 4 0 11-8 0c0-1.4.7-2.5 1.6-3.4.1 1.5.8 2.3 1.6 2.3.2-2.3-.7-3.4-.8-6.4z"/><path d="M12 13l1.4 4.2 4.4.2-3.5 2.6 1.3 4.2L12 22l-3.6 2.4 1.3-4.2-3.5-2.6 4.4-.2z" opacity=".5"/>',
  meteorite:
    '<path d="M15 2l3 3-2 2 3 3-4 1-1 4-3-3 6-10zM4 10l2 2-3 1zM6 15l2 2-4 1zM10 18l2 2-4 1z"/>',
  halo:
    '<path d="M12 8a4 4 0 100 8 4 4 0 000-8z" opacity=".6"/><path d="M12 2a2 2 0 100 4 2 2 0 000-4zM4 9a2 2 0 100 4 2 2 0 000-4zm16 0a2 2 0 100 4 2 2 0 000-4zM7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z"/>',
  mines:
    '<path d="M11 2h2v4h-2zM11 18h2v4h-2zM2 11h4v2H2zM18 11h4v2h-4zM4.5 4.5l2.8 2.8-1.4 1.4-2.8-2.8zM16.1 16.1l2.8 2.8-1.4 1.4-2.8-2.8zM19.5 4.5l-2.8 2.8 1.4 1.4 2.8-2.8zM7.9 16.1l-2.8 2.8 1.4 1.4 2.8-2.8z"/><path d="M12 7a5 5 0 100 10 5 5 0 000-10z"/>',
  thrust:
    '<path d="M2 12l7-6v4h6V6l7 6-7 6v-4H9v4z"/><path d="M17 4l1.4 2.6L21 8l-2.6 1.4L17 12l-1.4-2.6L13 8l2.6-1.4z" opacity=".6"/>',
  whip:
    '<path d="M3 4c6 0 6 6 11 6 3 0 4-2 4-4l3 1c0 4-3 6-7 6-7 0-7-6-11-6z"/><path d="M18 12l3 2-3 2-1-2z"/>',
} as const;
