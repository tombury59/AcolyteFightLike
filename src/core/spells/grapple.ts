import type { Spell, ProjectileBehavior } from './spell';
import { icons } from './icons';

// --- Réglages (unités monde en pixels, dt en secondes) ---
const HOOK_SPEED = 1300; // le crochet file vite
const HOOK_RANGE = 520; // portée avant de retomber
const HOOK_RADIUS = 8; // rayon d'accroche du crochet
const LINK_TIME = 1.2; // durée max du lien tant que le bouton est tenu (s)
const COOLDOWN = 5; // moyen
const COLOR = '#f472b6';

/**
 * Grappin fidèle à Acolyte Fight : sort MAINTENU. On tire un crochet dans la
 * direction visée (il ne vise pas tout seul et peut rater). À l'impact, l'ennemi
 * est lié : bouge ton curseur pour le faire tournoyer autour de toi, relâche pour
 * l'éjecter dans le vide grâce à l'élan accumulé (aucune éjection « scriptée »).
 * La physique du lien (ressort radial + poussée latérale) est dans simulation.ts.
 */
export const grapple: Spell = {
  id: 'grapple',
  name: 'Grappin',
  cooldown: COOLDOWN,
  color: COLOR,
  description:
    'Maintiens pour lancer le crochet vers ta visée. Une fois accroché, bouge le ' +
    'curseur pour faire tournoyer l’ennemi autour de toi, puis relâche : son élan ' +
    'l’envoie dans le vide.',
  preview: 'orb',
  icon: icons.grapple,
  cast(world, caster) {
    // Sort maintenu : on ne relance pas tant qu'un grappin est déjà en cours.
    if (caster.grapple) return;
    const dir = caster.facing;
    caster.grapple = {
      phase: 'flying',
      targetId: null,
      time: HOOK_RANGE / HOOK_SPEED,
      hookPos: { x: caster.pos.x, y: caster.pos.y },
    };
    world.projectiles.push({
      id: world.nextProjectileId++,
      ownerId: caster.id,
      pos: { x: caster.pos.x, y: caster.pos.y },
      vel: { x: dir.x * HOOK_SPEED, y: dir.y * HOOK_SPEED },
      radius: HOOK_RADIUS,
      color: COLOR,
      life: HOOK_RANGE / HOOK_SPEED,
      dead: false,
      behavior: 'grappleHook',
      renderKind: 'grappleHook',
      params: { linkTime: LINK_TIME },
    });
  },
};

/**
 * Crochet en vol : avance en ligne droite. S'il touche un ennemi, il crée le lien
 * (phase `linked`) sur son lanceur et disparaît. S'il retombe sans toucher, le
 * grappin est annulé.
 */
export const grappleHook: ProjectileBehavior = {
  update(world, proj, dt) {
    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;
    proj.life -= dt;

    const owner = world.players.find((p) => p.id === proj.ownerId);
    // Lanceur disparu, ou grappin déjà consommé/annulé : on retire le crochet.
    if (!owner || !owner.alive || !owner.grapple || owner.grapple.phase !== 'flying') {
      proj.dead = true;
      return;
    }
    // Touche relâchée avant l'accroche : on annule (sort maintenu).
    if (!owner.grappleHeld) {
      owner.grapple = null;
      proj.dead = true;
      return;
    }
    owner.grapple.hookPos = { x: proj.pos.x, y: proj.pos.y };

    for (const p of world.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      const dx = p.pos.x - proj.pos.x;
      const dy = p.pos.y - proj.pos.y;
      if (Math.hypot(dx, dy) <= proj.radius + p.radius) {
        owner.grapple = {
          phase: 'linked',
          targetId: p.id,
          time: proj.params.linkTime,
          hookPos: { x: p.pos.x, y: p.pos.y },
        };
        proj.dead = true;
        return;
      }
    }

    // Retombé sans rien toucher -> grappin annulé.
    if (proj.life <= 0) {
      owner.grapple = null;
      proj.dead = true;
    }
  },
};
