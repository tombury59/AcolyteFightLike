import type { Vec2 } from '../core/types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

/**
 * Effets purement visuels (non déterministes) : gerbes de particules à la mort,
 * bouffées à l'apparition d'un sort. Mis à jour en temps réel, indépendant du core.
 */
export class ParticleSystem {
  particles: Particle[] = [];

  private spawn(pos: Vec2, color: string, count: number, speed: number, life: number, radius: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      const l = life * (0.6 + Math.random() * 0.4);
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: l,
        maxLife: l,
        radius: radius * (0.6 + Math.random() * 0.8),
        color,
      });
    }
  }

  /** Gerbe d'explosion (mort d'un joueur). */
  burst(pos: Vec2, color: string): void {
    this.spawn(pos, color, 18, 260, 0.7, 5);
  }

  /** Petite bouffée (apparition d'un sort). */
  puff(pos: Vec2, color: string): void {
    this.spawn(pos, color, 8, 120, 0.4, 4);
  }

  update(dt: number): void {
    const survivors: Particle[] = [];
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.life -= dt;
      if (p.life > 0) survivors.push(p);
    }
    this.particles = survivors;
  }
}
