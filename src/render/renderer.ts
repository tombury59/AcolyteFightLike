import type { Player, WorldState } from '../core/types';
import { CONFIG } from '../core/config';
import { Camera } from './camera';

/** Rendu du monde sur un canvas 2D. Aucune logique de jeu ici. */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  camera: Camera;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D non disponible');
    this.ctx = ctx;
    this.camera = new Camera(canvas.width, canvas.height);
  }

  resize(w: number, h: number): void {
    this.canvas.width = w;
    this.canvas.height = h;
    this.camera.resize(w, h);
  }

  render(world: WorldState): void {
    const { ctx, camera } = this;

    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

    this.drawArena(world);
    for (const p of world.players) this.drawPlayer(p);
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

  private drawPlayer(p: Player): void {
    const { ctx, camera } = this;
    if (!p.alive) return;

    const s = camera.worldToScreen(p.pos);
    const r = p.radius * camera.zoom;

    // Corps.
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
}
