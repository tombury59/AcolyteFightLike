import type { Spell } from './spell';

const IMPULSE = 1800; // fort élan avant (le perso se rue et bouscule)
const CHARGE = 0.35; // durée pendant laquelle il projette les ennemis heurtés
const COOLDOWN = 1.6;
const COLOR = '#38bdf8';

/** Sort : ruée courte vers l'avant qui bouscule les ennemis heurtés. */
export const dash: Spell = {
  id: 'dash',
  name: 'Dash',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Se rue vers l’avant à toute vitesse et bouscule les ennemis heurtés au ' +
    'passage. Idéal pour percer ou repositionner rapidement.',
  preview: 'blink',
  icon: '<path d="M3 12l7-6v4h5V6l6 6-6 6v-4h-5v4z"/>',
  cast(_world, caster) {
    // Élan avant amorti par le moteur : le perso glisse et projette ce qu'il heurte.
    caster.knockback.x += caster.facing.x * IMPULSE;
    caster.knockback.y += caster.facing.y * IMPULSE;
    caster.chargeTime = CHARGE;
  },
};
