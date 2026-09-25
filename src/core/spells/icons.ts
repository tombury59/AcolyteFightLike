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
} as const;
