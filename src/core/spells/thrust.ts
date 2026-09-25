import type { Spell } from './spell';
import { icons } from './icons';

// Inspiré de « Thrust » d'Acolyte Fight : une ruée OFFENSIVE — comme la Charge,
// mais qui BLESSE chaque ennemi traversé (une fois), en plus de le bousculer.
// Réutilise la fenêtre de charge du moteur (chargeTime) + chargeDamage.
const IMPULSE = 1500; // élan avant (un peu moins que la Charge pure)
const CHARGE = 0.4; // fenêtre pendant laquelle on traverse et blesse
const DAMAGE = 18;
const COOLDOWN = 7;
const COLOR = '#ff2d7e';

/** Sort : ruée qui embroche les ennemis sur son passage (dégâts + poussée). */
export const thrust: Spell = {
  id: 'thrust',
  name: 'Ruée',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Fonce en avant en embrochant tout sur ton passage : dégâts et forte poussée. ' +
    'Te libère aussi de toute prise. Une charge offensive pour percer les lignes.',
  preview: 'thrust',
  icon: icons.thrust,
  cast(world, caster) {
    // Cleanse : rompt un grappin qui te tient.
    for (const o of world.players) {
      if (o.grapple && o.grapple.targetId === caster.id) o.grapple = null;
    }
    caster.frozenTime = 0;
    caster.knockback.x += caster.facing.x * IMPULSE;
    caster.knockback.y += caster.facing.y * IMPULSE;
    caster.chargeTime = CHARGE;
    caster.chargeDamage = DAMAGE;
    caster.chargeHits = [];
  },
};
