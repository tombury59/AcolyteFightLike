import type { Spell } from './spell';
import { icons } from './icons';

// Fidèle à « Charge » (thrust) d'Acolyte Fight : accélération brutale vers l'avant
// qui écarte tout sur son passage (0 dégât), et purge les effets sur soi (cleanse).
const IMPULSE = 1900; // fort élan avant
const CHARGE = 0.35; // fenêtre pendant laquelle on projette les ennemis heurtés
const COOLDOWN = 6;
const COLOR = '#ff00cc';

/** Sort : ruée puissante vers l'avant qui bouscule tout ; libère de toute prise. */
export const dash: Spell = {
  id: 'dash',
  name: 'Charge',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Accélère d’un coup vers l’avant en écartant violemment tout ce qui se trouve ' +
    'sur ton passage. Te libère aussi de toute prise (grappin) en cours.',
  preview: 'blink',
  icon: icons.dash,
  cast(world, caster) {
    // Cleanse : si un ennemi te tient au grappin, la charge rompt le lien.
    for (const o of world.players) {
      if (o.grapple && o.grapple.targetId === caster.id) o.grapple = null;
    }
    caster.frozenTime = 0;
    // Élan avant amorti par le moteur : le perso glisse et projette ce qu'il heurte.
    caster.knockback.x += caster.facing.x * IMPULSE;
    caster.knockback.y += caster.facing.y * IMPULSE;
    caster.chargeTime = CHARGE;
  },
};
