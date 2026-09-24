import type { Vec2 } from '../core/types';

/**
 * Caméra centrée sur une cible (le joueur local). Convertit entre
 * coordonnées MONDE et coordonnées ÉCRAN (pixels canvas).
 */
export class Camera {
  target: Vec2 = { x: 0, y: 0 };
  zoom = 1;

  constructor(
    public viewWidth: number,
    public viewHeight: number,
  ) {}

  resize(w: number, h: number): void {
    this.viewWidth = w;
    this.viewHeight = h;
  }

  worldToScreen(p: Vec2): Vec2 {
    return {
      x: (p.x - this.target.x) * this.zoom + this.viewWidth / 2,
      y: (p.y - this.target.y) * this.zoom + this.viewHeight / 2,
    };
  }

  screenToWorld(p: Vec2): Vec2 {
    return {
      x: (p.x - this.viewWidth / 2) / this.zoom + this.target.x,
      y: (p.y - this.viewHeight / 2) / this.zoom + this.target.y,
    };
  }
}
