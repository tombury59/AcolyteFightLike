import type { Spell, ProjectileBehavior } from './spell';
import { fireball, projectileHit } from './fireball';
import { dash } from './dash';
import { teleport } from './teleport';
import { shield } from './shield';
import { grapple, grappleHook } from './grapple';
import { laser, beamBehavior } from './laser';
import { arc } from './arc';
import { bolt, repulsor } from './bolt';
import { meteor, meteorBehavior } from './meteor';
import { homing, seeker } from './homing';
import { drain } from './drain';
import { boomerang, orbiter } from './boomerang';
import { whirlwind, whirlwindBehavior } from './whirlwind';
import { scourge, nova } from './scourge';
import { supernova } from './supernova';
import { gravity, gravityBehavior } from './gravity';
import { bouncer, bouncerBehavior } from './bouncer';
import { link, linkHook } from './link';
import { triplet } from './triplet';
import { flamestrike, flamestrikeBehavior } from './flamestrike';
import { meteorite } from './meteorite';
import { halo } from './halo';
import { mines, mineBehavior } from './mines';
import { thrust } from './thrust';
import { whip, whipBehavior } from './whip';

/**
 * Registre des sorts. Ajouter un sort = créer son fichier puis l'enregistrer ICI.
 * Le moteur (simulation) lit ce registre sans connaître aucun sort en particulier.
 */
export const SPELLS: Record<string, Spell> = {
  [fireball.id]: fireball,
  [bolt.id]: bolt,
  [laser.id]: laser,
  [arc.id]: arc,
  [grapple.id]: grapple,
  [dash.id]: dash,
  [teleport.id]: teleport,
  [shield.id]: shield,
  [meteor.id]: meteor,
  [homing.id]: homing,
  [drain.id]: drain,
  [boomerang.id]: boomerang,
  [whirlwind.id]: whirlwind,
  [scourge.id]: scourge,
  [supernova.id]: supernova,
  [gravity.id]: gravity,
  [bouncer.id]: bouncer,
  [link.id]: link,
  [triplet.id]: triplet,
  [flamestrike.id]: flamestrike,
  [meteorite.id]: meteorite,
  [halo.id]: halo,
  [mines.id]: mines,
  [thrust.id]: thrust,
  [whip.id]: whip,
};

/** Registre des comportements de projectiles, indexés par leur clé `behavior`. */
export const PROJECTILE_BEHAVIORS: Record<string, ProjectileBehavior> = {
  projectileHit,
  repulsor,
  beam: beamBehavior,
  grappleHook,
  meteor: meteorBehavior,
  seeker,
  orbiter,
  whirlwind: whirlwindBehavior,
  nova,
  gravity: gravityBehavior,
  bouncer: bouncerBehavior,
  linkHook,
  flamestrike: flamestrikeBehavior,
  mine: mineBehavior,
  whip: whipBehavior,
};

/** Sorts équipés par défaut, dans l'ordre des emplacements. */
export const DEFAULT_SPELL_SET = [fireball.id, dash.id];
