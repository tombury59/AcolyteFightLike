type SfxName = 'cast' | 'death' | 'win' | 'lose';

/**
 * Effets sonores synthétisés (aucun fichier). Volume volontairement discret.
 * L'AudioContext doit être réveillé sur une interaction (clic « Jouer »).
 */
class Sfx {
  private ctx: AudioContext | null = null;

  /** À appeler sur un geste utilisateur (sinon l'audio reste bloqué). */
  resume(): void {
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      void this.ctx.resume();
    } catch {
      /* Web Audio indisponible : on ignore. */
    }
  }

  private tone(freq: number, duration: number, type: OscillatorType, delay = 0, volume = 0.05): void {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  play(name: SfxName): void {
    if (!this.ctx) return;
    switch (name) {
      case 'cast':
        this.tone(180, 0.18, 'square', 0, 0.04);
        break;
      case 'death':
        this.tone(320, 0.25, 'sawtooth', 0, 0.05);
        this.tone(140, 0.3, 'sawtooth', 0.05, 0.05);
        break;
      case 'win':
        this.tone(523, 0.15, 'triangle', 0, 0.06);
        this.tone(784, 0.25, 'triangle', 0.14, 0.06);
        break;
      case 'lose':
        this.tone(300, 0.3, 'triangle', 0, 0.06);
        this.tone(180, 0.4, 'triangle', 0.18, 0.06);
        break;
    }
  }
}

export const sfx = new Sfx();
