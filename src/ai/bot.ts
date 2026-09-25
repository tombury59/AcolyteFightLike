import type { Player, PlayerInput, Vec2, WorldState } from '../core/types';
import { sub, len, dist, normalize } from '../core/vec';

// --- Réglages de distance de combat ---
const PREFERRED_DIST = 230; // distance de combat idéale (kiting)
const BAND = 55; // hystérésis autour de la distance idéale
const DASH_CLOSE_DIST = 340; // au-delà : on peut dasher pour combler l'écart
const PROJ_SPEED_REF = 700; // vitesse de projectile de référence (visée anticipée)
const AIM_JITTER = 0.5; // erreur de visée aléatoire (radians, ~7.5°) -> tirs moins parfaits

// --- Rôles des sorts (pour un choix tactique) ---
const MOBILITY = new Set(['dash', 'teleport']); // repositionnement / fuite
const CHANNEL = new Set(['laser', 'supernova']); // fige le lanceur : seulement en sécurité
const DEFENSE = new Set(['shield', 'whirlwind']); // réaction aux projectiles
const KNOCKOUT = new Set(['bolt', 'meteor', 'grapple', 'scourge']); // pousser hors de l'arène
const CONTROL = new Set(['gravity', 'link']); // immobiliser / attirer

/**
 * IA d'un bot : même interface que le joueur (aim + follow + castSpells).
 * Comportements : fuite du bord, esquive des projectiles (avec bouclier/tourbillon
 * réactifs), kiting à bonne distance, visée anticipée et choix de sort tactique.
 */
export function computeBotInput(world: WorldState, bot: Player): PlayerInput {
  const target = nearestEnemy(world, bot);
  if (!target) return { aim: { ...bot.pos }, follow: false, castSpells: [] };

  const toT = sub(target.pos, bot.pos);
  const d = len(toT);
  const dirT = d > 1e-3 ? { x: toT.x / d, y: toT.y / d } : { x: 1, y: 0 };
  const distC = dist(bot.pos, world.arenaCenter);
  const edge = world.arenaRadius - bot.radius;

  const equipped = bot.spellSlots.filter((s): s is string => !!s);
  const ready = new Set(equipped.filter((id) => (bot.cooldowns[id] ?? 0) <= 0));
  const has = (id: string) => ready.has(id);
  const lowHP = bot.health < 40;

  // ===== 1) Survie : ne pas sortir de l'arène =====
  if (distC > edge - 60) {
    const toCenter = normalize(sub(world.arenaCenter, bot.pos));
    const cast: string[] = [];
    // Vraiment au bord : se propulser vers le centre s'il a de la mobilité.
    if (distC > edge - 14) {
      const mob = has('teleport') ? 'teleport' : has('dash') ? 'dash' : null;
      if (mob) cast.push(mob);
    }
    return { aim: pointFrom(bot.pos, toCenter, 320), follow: true, castSpells: cast };
  }

  // ===== 2) Réagir à un projectile entrant =====
  // Les bots N'ESQUIVENT PLUS les projectiles (difficulté réduite). Ils se
  // contentent de bloquer avec une défense s'ils en ont une de prête et de face.
  const threat = incomingThreat(world, bot);
  if (threat && threat.reflectable) {
    // Bouclier : renvoie les projectiles réfléchissables arrivant de face.
    if (has('shield')) {
      return { aim: { ...threat.from }, follow: false, castSpells: ['shield'] };
    }
    // Tourbillon : gobe le projectile — on avance dedans.
    if (has('whirlwind')) {
      return { aim: { ...threat.from }, follow: true, castSpells: ['whirlwind'] };
    }
  }

  // ===== 3) Positionnement + attaque =====
  const lead = predictAim(target, d);
  const targetNearEdge = dist(target.pos, world.arenaCenter) > edge - 70;
  const safeToChannel = distC < edge - 130 && d > 240 && d < 540;

  // Trop près : reculer (kiting). Au corps à corps, une AoE de contact reste utile.
  if (d < PREFERRED_DIST - BAND) {
    const cast: string[] = [];
    if (has('scourge')) cast.push('scourge');
    else if (has('shield') && lowHP) cast.push('shield');
    return { aim: pointFrom(bot.pos, { x: -dirT.x, y: -dirT.y }, 260), follow: true, castSpells: cast };
  }

  // Choix du sort offensif (en visant la cible), avec une visée imparfaite mais fluide.
  const cast = pickOffense(ready, { lowHP, targetNearEdge, safeToChannel });
  const aim = jitterAim(bot.pos, lead, aimErrorAngle(bot, world.time));

  // Trop loin : avancer (en tirant), dash si l'écart est grand.
  if (d > PREFERRED_DIST + BAND) {
    if (d > DASH_CLOSE_DIST && has('dash') && cast.length === 0) cast.push('dash');
    return { aim, follow: true, castSpells: cast };
  }

  // À bonne distance : tenir la position et tirer (visée anticipée + imprécision).
  return { aim, follow: false, castSpells: cast };
}

/** Sélectionne UN sort offensif selon le contexte tactique. */
function pickOffense(
  ready: Set<string>,
  ctx: { lowHP: boolean; targetNearEdge: boolean; safeToChannel: boolean },
): string[] {
  let opts = [...ready].filter((id) => !MOBILITY.has(id) && !DEFENSE.has(id));
  if (!ctx.safeToChannel) opts = opts.filter((id) => !CHANNEL.has(id));
  if (opts.length === 0) return [];

  // Faible vie : se soigner via le drain si dispo.
  if (ctx.lowHP && opts.includes('drain')) return ['drain'];
  // Cible au bord : privilégier un sort qui l'éjecte hors de l'arène.
  if (ctx.targetNearEdge) {
    const ko = opts.find((id) => KNOCKOUT.has(id));
    if (ko) return [ko];
  }
  // En sécurité : sortir un gros sort canalisé de temps en temps.
  if (ctx.safeToChannel) {
    const ch = opts.find((id) => CHANNEL.has(id));
    if (ch && Math.random() < 0.4) return [ch];
  }
  // Un peu de contrôle de temps en temps.
  if (Math.random() < 0.3) {
    const ctrl = opts.find((id) => CONTROL.has(id));
    if (ctrl) return [ctrl];
  }
  return [opts[Math.floor(Math.random() * opts.length)]];
}

/** Point situé à `d` unités de `from` dans la direction `dir`. */
function pointFrom(from: Vec2, dir: Vec2, d: number): Vec2 {
  return { x: from.x + dir.x * d, y: from.y + dir.y * d };
}

/**
 * Erreur de visée qui DÉRIVE doucement (pas de tremblement) : somme de deux sinus
 * lents, déphasés par bot. Les tirs restent imprécis, mais la visée est fluide.
 */
function aimErrorAngle(bot: Player, time: number): number {
  let seed = 0;
  for (let i = 0; i < bot.id.length; i++) seed += bot.id.charCodeAt(i);
  const s = (Math.sin(time * 1.3 + seed) + 0.5 * Math.sin(time * 0.53 + seed * 1.7)) / 1.5;
  return s * AIM_JITTER;
}

/** Applique une erreur angulaire (radians) à la visée. */
function jitterAim(from: Vec2, point: Vec2, angleOffset: number): Vec2 {
  const dx = point.x - from.x;
  const dy = point.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return { ...point };
  const ang = Math.atan2(dy, dx) + angleOffset;
  return { x: from.x + Math.cos(ang) * d, y: from.y + Math.sin(ang) * d };
}

/** Visée anticipée : vise là où la cible SERA, d'après sa vitesse actuelle. */
function predictAim(target: Player, d: number): Vec2 {
  const t = Math.min(0.6, d / PROJ_SPEED_REF);
  const vx = target.vel.x + target.knockback.x;
  const vy = target.vel.y + target.knockback.y;
  return { x: target.pos.x + vx * t, y: target.pos.y + vy * t };
}

interface Threat {
  from: Vec2; // origine du projectile (pour orienter le bouclier)
  dodge: Vec2; // direction d'esquive (perpendiculaire à la trajectoire)
  reflectable: boolean;
  severe: boolean; // impact imminent ou gros projectile
}

/**
 * Cherche le projectile ennemi le plus menaçant (en approche, trajectoire proche).
 * Renvoie de quoi l'esquiver ou le bloquer, ou `null` si rien de dangereux.
 */
function incomingThreat(world: WorldState, bot: Player): Threat | null {
  let best: Threat | null = null;
  let bestTti = Infinity;
  for (const proj of world.projectiles) {
    if (proj.dead || proj.ownerId === bot.id) continue;
    const speed = Math.hypot(proj.vel.x, proj.vel.y);
    if (speed < 40) continue; // faisceaux / puits statiques : ignorés ici
    const rx = bot.pos.x - proj.pos.x;
    const ry = bot.pos.y - proj.pos.y;
    const dx = proj.vel.x / speed;
    const dy = proj.vel.y / speed;
    const along = rx * dx + ry * dy; // avancée le long de la trajectoire
    if (along <= 0 || along > 520) continue; // derrière, ou trop loin
    const perpx = rx - dx * along;
    const perpy = ry - dy * along;
    const perp = Math.hypot(perpx, perpy);
    if (perp > bot.radius + proj.radius + 30) continue; // ne passe pas assez près
    const tti = along / speed; // temps avant impact
    if (tti > 0.85) continue;
    if (tti < bestTti) {
      bestTti = tti;
      // Esquive : s'écarter perpendiculairement (du côté où l'on est déjà).
      const dodge =
        perp > 1e-3 ? { x: perpx / perp, y: perpy / perp } : { x: -dy, y: dx };
      best = {
        from: { x: proj.pos.x, y: proj.pos.y },
        dodge,
        reflectable: !!proj.params.reflectable,
        severe: tti < 0.3 || proj.radius > 30,
      };
    }
  }
  return best;
}

function nearestEnemy(world: WorldState, bot: Player): Player | null {
  let best: Player | null = null;
  let bestDist = Infinity;
  for (const p of world.players) {
    if (!p.alive || p.id === bot.id) continue;
    const dd = dist(p.pos, bot.pos);
    if (dd < bestDist) {
      bestDist = dd;
      best = p;
    }
  }
  return best;
}
