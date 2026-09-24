import type { Player, Projectile, WorldState } from '../core/types';
import { CONFIG } from '../core/config';
import { SPELLS } from '../core/spells/definitions';
import { Camera } from './camera';

const LOCAL_PLAYER_ID = 'you';

/** Rendu du monde sur un canvas 2D. Aucune logique de jeu ici. */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  camera: Camera;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D non disponible');
    this.ctx = ctx;
    this.camera = new Camera(canvas.width, canvas.height);
    // La caméra reste centrée sur l'arène (origine du monde).
    this.camera.target = { x: 0, y: 0 };
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.camera.resize(w, h);
    // Zoom pour que toute l'arène de départ tienne à l'écran, avec une marge.
    const diameter = CONFIG.arena.startRadius * 2 * 1.12;
    this.camera.zoom = Math.min(w, h) / diameter;
  }

  render(world: WorldState): void {
    const { ctx, camera } = this;

    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

    this.drawArena(world);
    for (const proj of world.projectiles) this.drawProjectile(proj);
    for (const p of world.players) this.drawPlayer(p);
    this.drawHud(world);
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
    ctx.beginPath();
    ctx.arc(s.x, s.y, proj.radius * camera.zoom, 0, Math.PI * 2);
    ctx.fillStyle = proj.color;
    ctx.fill();
  }

  private drawPlayer(p: Player): void {
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

    // Barre de vie.
    const barW = r * 2.4;
    const barH = 5;
    const bx = s.x - barW / 2;
    const by = s.y - r - 14;
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(bx, by, barW * (p.health / CONFIG.player.maxHealth), barH);
  }

  /** Barre de sorts en bas de l'écran avec l'état de recharge du joueur local. */
  private drawHud(world: WorldState): void {
    const { ctx, camera } = this;
    const me = world.players.find((p) => p.id === LOCAL_PLAYER_ID);
    if (!me) return;

    const size = 52;
    const gap = 10;
    const total = me.spellSet.length * size + (me.spellSet.length - 1) * gap;
    let x = camera.viewWidth / 2 - total / 2;
    const y = camera.viewHeight - size - 28;

    me.spellSet.forEach((spellId, i) => {
      const spell = SPELLS[spellId];
      if (!spell) return;
      const cd = me.cooldowns[spellId] ?? 0;
      const frac = cd > 0 ? cd / spell.cooldown : 0;

      // Case.
      ctx.fillStyle = '#131824';
      ctx.fillRect(x, y, size, size);
      ctx.lineWidth = 2;
      ctx.strokeStyle = spell.color;
      ctx.strokeRect(x, y, size, size);

      // Voile de recharge (se vide du bas vers le haut).
      if (frac > 0) {
        ctx.fillStyle = 'rgba(11, 14, 20, 0.72)';
        ctx.fillRect(x, y, size, size * frac);
      }

      // Numéro d'emplacement.
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(String(i + 1), x + 5, y + 4);

      // Nom du sort.
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(spell.name, x + 5, y + size - 4);

      x += size + gap;
    });
  }
}
