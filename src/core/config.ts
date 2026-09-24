/** Constantes de gameplay, regroupées pour être faciles à ajuster. */
export const CONFIG = {
  /** Pas de simulation fixe (60 Hz). */
  fixedDt: 1 / 60,

  arena: {
    startRadius: 500,
    /** Rayon en dessous duquel l'arène ne rétrécit plus. */
    minRadius: 120,
    /** Vitesse de rétrécissement en unités/seconde. */
    shrinkRate: 12,
    /** Délai avant que le rétrécissement commence (s). */
    shrinkDelay: 5,
  },

  player: {
    radius: 18,
    speed: 260,
    maxHealth: 100,
    /** Dégâts par seconde infligés hors de l'arène. */
    outOfBoundsDps: 20,
  },
} as const;
