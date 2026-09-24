import type { Player, Projectile, WorldState } from '../core/types';
import { CONFIG } from '../core/config';
import { SPELLS } from '../core/spells/definitions';
import { Camera } from './camera';
import type { Particle } from './effects';

const LOCAL_PLAYER_ID = 'you';

/** Options de rendu (mode démo, décalage parallax). */
export interface RenderOptions {
  /** Cache barres de vie, noms et HUD (fond de menu). */
  minimal?: boolean;
  /** Décalage parallax normalisé (-1..1) piloté par la souris. */
  parallax?: { x: number; y: number };
}

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

/** Amplitude du parallax : la scène (proche) bouge plus que les étoiles (loin). */
const NEAR_PARALLAX = 60; // unités monde
const STAR_PARALLAX = 16; // pixels

/** Rendu du monde sur un canvas 2D. Aucune logique de jeu ici. */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  camera: Camera;
  private stars: Star[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D non disponible');
    this.ctx = ctx;
    this.camera = new Camera(canvas.width, canvas.height);
    this.camera.target = { x: 0, y: 0 };
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.camera.resize(w, h);
    const diameter = CONFIG.arena.startRadius * 2 * 1.12;
    this.camera.zoom = Math.min(w, h) / diameter;
    this.generateStars(w, h);
  }

  private generateStars(w: number, h: number): void {
    const count = Math.round((w * h) / 9000);
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.5 + 0.15,
    }));
  }

  render(world: WorldState, particles: Particle[] = [], opts: RenderOptions = {}): void {
    const { ctx, camera } = this;

    // Décalage parallax de la scène (couche proche).
    camera.target = opts.parallax
      ? { x: opts.parallax.x * NEAR_PARALLAX, y: opts.parallax.y * NEAR_PARALLAX }
      : { x: 0, y: 0 };

    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

    if (opts.parallax) this.drawStars(opts.parallax);

    this.drawArena(world);
    for (const proj of world.projectiles) this.drawProjectile(proj);
    for (const p of world.players) this.drawPlayer(p, opts.minimal ?? false);
    this.drawParticles(particles);
    if (!opts.minimal) this.drawHud(world);
  }

  /** Champ d'étoiles en fond, décalé faiblement (couche lointaine du parallax). */
  private drawStars(parallax: { x: number; y: number }): void {
    const { ctx } = this;
    const ox = parallax.x * STAR_PARALLAX;
    const oy = parallax.y * STAR_PARALLAX;
    ctx.fillStyle = '#e5e7eb';
    for (const s of this.stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawParticles(particles: Particle[]): void {
    const { ctx, camera } = this;
    for (const p of particles) {
      const s = camera.worldToScreen({ x: p.x, y: p.y });
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.radius * camera.zoom, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawArena(world: WorldState): void {
    const { ctx, camera } = this;
    const c = camera.worldToScreen(world.arenaCenter);
    const r = world.arenaRadius * camera.zoom;

    // Zone dangereuse à l'extérieur.
    ctx.fillStyle = 'rgba(220, 38, 38, 0.08)';
    ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

    // Sol de l'arène.
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#131824';
    ctx.fill();

    // Bordure.
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
  }

  private drawProjectile(proj: Projectile): void {
    const { ctx, camera } = this;
    const s = camera.worldToScreen(proj.pos);
    const r = proj.radius * camera.zoom;

    // Corps translucide (on voit les joueurs emportés à l'intérieur).
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fillStyle = proj.color;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Contour net.
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = proj.color;
    ctx.stroke();
  }

  private drawPlayer(p: Player, minimal: boolean): void {
    const { ctx, camera } = this;
    if (!p.alive) return;

    const s = camera.worldToScreen(p.pos);
    const r = p.radius * camera.zoom;

    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    // Indicateur de visée.
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + p.facing.x * r * 1.8, s.y + p.facing.y * r * 1.8);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#e5e7eb';
    ctx.stroke();

    // En mode démo (fond de menu) : pas de barre de vie ni de nom.
    if (minimal) return;

    const barW = r * 2.4;
    const barH = 5;
    const bx = s.x - barW / 2;
    const by = s.y - r - 14;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(bx, by, barW * (p.health / CONFIG.player.maxHealth), barH);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(p.name, s.x, by - 4);
    ctx.textAlign = 'left';
  }

  /** Barre des 4 emplacements en bas de l'écran (état de recharge du joueur local). */
  private drawHud(world: WorldState): void {
    const { ctx, camera } = this;
    const me = world.players.find((p) => p.id === LOCAL_PLAYER_ID);
    if (!me) return;

    const size = 52;
    const gap = 10;
    const slots = me.spellSlots;
    const total = slots.length * size + (slots.length - 1) * gap;
    let x = camera.viewWidth / 2 - total / 2;
    const y = camera.viewHeight - size - 28;

    slots.forEach((spellId, i) => {
      const spell = spellId ? SPELLS[spellId] : undefined;

      // Case (couleur du sort si équipé, sinon vide/grisé).
      ctx.fillStyle = '#131824';
      ctx.fillRect(x, y, size, size);
      ctx.lineWidth = 2;
      ctx.strokeStyle = spell ? spell.color : '#374151';
      ctx.strokeRect(x, y, size, size);

      if (spell) {
        const cd = me.cooldowns[spellId!] ?? 0;
        const frac = cd > 0 ? cd / spell.cooldown : 0;
        if (frac > 0) {
          ctx.fillStyle = 'rgba(11, 14, 20, 0.72)';
          ctx.fillRect(x, y, size, size * frac);
        }
        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px system-ui, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'left';
        ctx.fillText(spell.name, x + 5, y + size - 4);
      }

      // Numéro d'emplacement (= touche).
      ctx.fillStyle = spell ? '#e5e7eb' : '#4b5563';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(String(i + 1), x + 5, y + 4);

      x += size + gap;
    });
  }
}
