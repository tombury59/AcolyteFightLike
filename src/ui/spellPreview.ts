/**
 * Animations du grimoire : un rendu dédié par archétype de sort.
 * `drawSpellPreview` est appelé chaque frame avec la clé `preview` du sort.
 */

const TAU = Math.PI * 2;
const CASTER = '#4ade80';
const ENEMY = '#f87171';

const easeOut = (q: number) => 1 - (1 - q) * (1 - q);
const easeIn = (q: number) => q * q;
const quad = (a: number, b: number, c: number, t: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
/** Onde triangulaire 0→1→0. */
const tri = (v: number) => {
  const f = ((v % 1) + 1) % 1;
  return f < 0.5 ? f * 2 : 2 - 2 * f;
};

interface Stage {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  CY: number;
  CX: number; // position du lanceur
  TX: number; // position de la cible
  color: string;
  t: number;
}

function disc(s: Stage, x: number, y: number, r: number, color: string, alpha = 1): void {
  const { ctx } = s;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function ring(s: Stage, x: number, y: number, r: number, color: string, lw = 3, alpha = 1): void {
  const { ctx } = s;
  if (r <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.lineWidth = lw;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function line(s: Stage, x1: number, y1: number, x2: number, y2: number, color: string, lw = 3): void {
  const { ctx } = s;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = lw;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/** Le lanceur (pastille verte avec indicateur de visée). */
function caster(s: Stage, x = s.CX, y = s.CY): void {
  disc(s, x, y, 16, CASTER);
  line(s, x, y, x + 24, y, '#e5e7eb', 3);
}

function enemy(s: Stage, x = s.TX, y = s.CY, r = 14): void {
  disc(s, x, y, r, ENEMY);
}

function period(t: number, p: number): number {
  return (t % p) / p;
}

// --- Archétypes ---

function projectile(s: Stage): void {
  const p = period(s.t, 1.6);
  caster(s);
  const from = s.CX + 26;
  if (p < 0.72) {
    enemy(s);
    const x = from + (s.TX - 14 - from) * (p / 0.72);
    disc(s, x, s.CY, 12, s.color, 0.6);
    ring(s, x, s.CY, 12, s.color);
  } else {
    const q = (p - 0.72) / 0.28;
    enemy(s);
    ring(s, s.TX, s.CY, 12 + q * 30, s.color, 3, 1 - q);
  }
}

function bolt(s: Stage): void {
  const p = period(s.t, 1.5);
  caster(s);
  const from = s.CX + 26;
  if (p < 0.35) {
    const x = from + (s.TX - from) * (p / 0.35);
    enemy(s);
    s.ctx.lineCap = 'round';
    line(s, x - 34, s.CY, x, s.CY, s.color, 4);
    s.ctx.lineCap = 'butt';
  } else {
    const q = (p - 0.35) / 0.65;
    const tx = s.TX + easeOut(q) * 90;
    enemy(s, tx);
    ring(s, tx, s.CY, 14 + q * 10, s.color, 2, 1 - q);
  }
}

function beam(s: Stage): void {
  const p = period(s.t, 2.2);
  caster(s);
  enemy(s);
  const from = s.CX + 26;
  if (p < 0.5) {
    const g = Math.sin((p / 0.5) * Math.PI);
    s.ctx.save();
    s.ctx.setLineDash([8, 7]);
    s.ctx.globalAlpha = 0.5;
    line(s, from, s.CY, s.W, s.CY, s.color, 2);
    s.ctx.restore();
    disc(s, from, s.CY, 5 + g * 10, s.color, 0.5 + 0.5 * g);
  } else {
    const q = (p - 0.5) / 0.5;
    const w = 6 + Math.sin(q * Math.PI) * 5;
    const { ctx } = s;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.35;
    line(s, from, s.CY, s.W, s.CY, s.color, w * 3);
    ctx.globalAlpha = 1;
    line(s, from, s.CY, s.W, s.CY, '#fff', w);
    line(s, from, s.CY, s.W, s.CY, s.color, w * 0.5);
    ctx.lineCap = 'butt';
  }
}

function beamBig(s: Stage): void {
  const p = period(s.t, 3.0);
  caster(s);
  enemy(s);
  const from = s.CX + 26;
  if (p < 0.65) {
    // Longue charge : orbe qui grossit + réticule pulsé.
    const q = p / 0.65;
    const g = Math.sin(q * Math.PI * 0.5);
    s.ctx.save();
    s.ctx.setLineDash([6, 6]);
    s.ctx.globalAlpha = 0.4 + 0.3 * g;
    line(s, from, s.CY, s.W, s.CY, s.color, 2);
    s.ctx.restore();
    ring(s, from, s.CY, 10 + g * 22, s.color, 2, 0.5);
    disc(s, from, s.CY, 6 + g * 18, s.color, 0.6 + 0.4 * g);
  } else {
    // Décharge : faisceau très large.
    const q = (p - 0.65) / 0.35;
    const w = 16 + Math.sin(q * Math.PI) * 8;
    const { ctx } = s;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.3;
    line(s, from, s.CY, s.W, s.CY, s.color, w * 2.4);
    ctx.globalAlpha = 1;
    line(s, from, s.CY, s.W, s.CY, '#fff', w);
    line(s, from, s.CY, s.W, s.CY, s.color, w * 0.5);
    ctx.lineCap = 'butt';
  }
}

function spray(s: Stage): void {
  caster(s);
  const from = s.CX + 26;
  const n = 8;
  for (let i = 0; i < n; i++) {
    const ang = (-0.5 + i / (n - 1)) * 1.0; // éventail ~±29°
    const pp = ((s.t * 0.9 + i * 0.13) % 1);
    const dist = pp * 320;
    const x = from + Math.cos(ang) * dist;
    const y = s.CY + Math.sin(ang) * dist;
    disc(s, x, y, 4, s.color, 1 - pp * 0.6);
  }
}

function swing(s: Stage): void {
  const p = period(s.t, 2.6);
  caster(s);
  const from = s.CX + 26;
  if (p < 0.28) {
    const x = from + (s.TX - from) * (p / 0.28);
    line(s, s.CX, s.CY, x, s.CY, s.color, 3);
    disc(s, x, s.CY, 5, s.color);
    enemy(s);
  } else if (p < 0.82) {
    const q = (p - 0.28) / 0.54;
    const ang = -0.25 + q * Math.PI * 1.25;
    const R = 150;
    const tx = s.CX + Math.cos(ang) * R;
    const ty = s.CY + Math.sin(ang) * R;
    line(s, s.CX, s.CY, tx, ty, s.color, 3);
    enemy(s, tx, ty);
  } else {
    const q = (p - 0.82) / 0.18;
    const ang = Math.PI * 1.02;
    const R = 150 + easeOut(q) * 260;
    enemy(s, s.CX + Math.cos(ang) * R, s.CY + Math.sin(ang) * R, 14 * (1 - q * 0.3));
  }
}

function pull(s: Stage): void {
  const p = period(s.t, 2.0);
  caster(s);
  const from = s.CX + 26;
  const { ctx } = s;
  ctx.save();
  ctx.setLineDash([6, 5]);
  if (p < 0.35) {
    const x = from + (s.TX - from) * (p / 0.35);
    line(s, s.CX, s.CY, x, s.CY, s.color, 3);
    disc(s, x, s.CY, 5, s.color);
    enemy(s);
  } else {
    const q = (p - 0.35) / 0.65;
    const tx = s.TX - (s.TX - (s.CX + 40)) * easeOut(q);
    line(s, s.CX, s.CY, tx, s.CY, s.color, 3);
    enemy(s, tx);
  }
  ctx.restore();
}

function dash(s: Stage): void {
  const p = period(s.t, 1.5);
  const stop = s.TX - 40;
  if (p < 0.45) {
    const cx = s.CX + (stop - s.CX) * easeIn(p / 0.45);
    enemy(s);
    disc(s, cx - 22, s.CY, 14, CASTER, 0.3);
    disc(s, cx, s.CY, 16, CASTER);
  } else {
    const q = (p - 0.45) / 0.55;
    enemy(s, s.TX + easeOut(q) * 80);
    disc(s, stop, s.CY, 16, CASTER);
  }
}

function blink(s: Stage): void {
  const p = period(s.t, 1.6);
  const startX = s.CX + 40;
  const jump = 180;
  const r = 16;
  const x = p < 0.5 ? startX : startX + jump;
  if (p >= 0.5 && p < 0.72) {
    const fade = 1 - (p - 0.5) / 0.22;
    s.ctx.globalAlpha = 0.5 * fade;
    line(s, startX, s.CY, startX + jump, s.CY, s.color, 4);
    s.ctx.globalAlpha = 1;
  }
  if (p >= 0.48 && p < 0.6) ring(s, x, s.CY, r + 10, s.color, 2);
  disc(s, x, s.CY, r, CASTER);
  line(s, x, s.CY, x + r * 1.8, s.CY, '#e5e7eb', 3);
}

function shield(s: Stage): void {
  const p = period(s.t, 1.8);
  const sx = s.CX + 90;
  disc(s, sx, s.CY, 16, CASTER);
  // Arc frontal (bouclier) orienté vers la droite.
  s.ctx.globalAlpha = 0.85;
  s.ctx.beginPath();
  s.ctx.arc(sx, s.CY, 34, -0.9, 0.9);
  s.ctx.lineWidth = 6;
  s.ctx.strokeStyle = s.color;
  s.ctx.stroke();
  s.ctx.globalAlpha = 1;
  const inX = sx + 40;
  if (p < 0.5) {
    const x = s.W - 40 - (s.W - 40 - inX) * (p / 0.5);
    disc(s, x, s.CY, 8, ENEMY);
  } else {
    const q = (p - 0.5) / 0.5;
    const x = inX + (s.W - 40 - inX) * q;
    if (q < 0.25) ring(s, sx + 34, s.CY, 8 + q * 40, '#fff', 2, 1 - q * 4);
    disc(s, x, s.CY, 8, s.color); // renvoyé (change de camp)
  }
}

function meteor(s: Stage): void {
  const p = period(s.t, 2.8);
  const orbR = 40;
  const x = -orbR + p * (s.W + orbR * 2);
  let tx = s.TX;
  if (x + orbR + 14 > s.TX && x < s.TX + 220) tx = x + orbR + 14;
  enemy(s, tx);
  disc(s, x - orbR * 0.7, s.CY, orbR * 0.8, '#555', 0.25);
  disc(s, x, s.CY, orbR, s.color, 0.55);
  ring(s, x, s.CY, orbR, s.color, 3);
}

function seek(s: Stage): void {
  const p = period(s.t, 2.2);
  const ty = s.CY - 42;
  enemy(s, s.TX, ty);
  caster(s);
  const sx = s.CX + 26;
  const cxp = (sx + s.TX) / 2;
  const cyp = s.CY + 76;
  const x = quad(sx, cxp, s.TX, p);
  const y = quad(s.CY, cyp, ty, p);
  disc(s, x, y, 7, s.color);
  ring(s, x, y, 7, s.color, 2);
}

function drain(s: Stage): void {
  const p = period(s.t, 2.2);
  enemy(s);
  caster(s);
  const from = s.CX + 26;
  if (p < 0.5) {
    const x = from + (s.TX - from) * (p / 0.5);
    disc(s, x, s.CY, 6, s.color);
  } else {
    const q = (p - 0.5) / 0.5;
    for (let k = 0; k < 4; k++) {
      const pp = (q + k / 4) % 1;
      const x = s.TX - (s.TX - s.CX) * pp;
      disc(s, x, s.CY - Math.sin(pp * Math.PI) * 22, 4, s.color, 1 - pp * 0.6);
    }
    ring(s, s.CX, s.CY, 18 + Math.sin(q * Math.PI) * 5, s.color, 2, 0.8);
  }
}

function orbit(s: Stage): void {
  const cx = s.W * 0.45;
  const R = 88;
  const ang = s.t * 2.2;
  disc(s, cx, s.CY, 16, CASTER);
  enemy(s, cx + 155, s.CY);
  s.ctx.globalAlpha = 0.3;
  s.ctx.beginPath();
  s.ctx.arc(cx, s.CY, R, ang - 1.2, ang);
  s.ctx.lineWidth = 3;
  s.ctx.strokeStyle = s.color;
  s.ctx.stroke();
  s.ctx.globalAlpha = 1;
  const x = cx + Math.cos(ang) * R;
  const y = s.CY + Math.sin(ang) * R;
  disc(s, x, y, 7, s.color);
  ring(s, x, y, 7, s.color, 2);
}

function swirl(s: Stage): void {
  const cx = s.W * 0.5;
  disc(s, cx, s.CY, 40, s.color, 0.12);
  for (let k = 0; k < 3; k++) {
    const a = s.t * 4 + (k * TAU) / 3;
    s.ctx.globalAlpha = 0.7;
    s.ctx.beginPath();
    s.ctx.arc(cx, s.CY, 24 + k * 10, a, a + Math.PI * 1.2);
    s.ctx.lineWidth = 3;
    s.ctx.strokeStyle = s.color;
    s.ctx.stroke();
    s.ctx.globalAlpha = 1;
  }
  const p = period(s.t, 2.0);
  const ang = s.t * 5;
  const rr = 120 * (1 - p);
  if (p < 0.92) disc(s, cx + Math.cos(ang) * rr, s.CY + Math.sin(ang) * rr, 6, ENEMY, 1 - p * 0.4);
}

function nova(s: Stage): void {
  const p = period(s.t, 2.0);
  const cx = s.W * 0.5;
  const around: [number, number][] = [
    [cx - 95, s.CY - 34],
    [cx + 95, s.CY + 24],
  ];
  disc(s, cx, s.CY, 16, CASTER);
  if (p < 0.5) {
    const q = p / 0.5;
    ring(s, cx, s.CY, 18 + 60 * (1 - q), s.color, 3, 0.85);
    around.forEach(([x, y]) => enemy(s, x, y, 12));
  } else {
    const q = (p - 0.5) / 0.5;
    ring(s, cx, s.CY, 20 + q * 95, s.color, 4, 1 - q);
    around.forEach(([x, y]) => {
      const dx = x - cx;
      const dy = y - s.CY;
      const d = Math.hypot(dx, dy) || 1;
      const push = easeOut(q) * 42;
      enemy(s, x + (dx / d) * push, y + (dy / d) * push, 12);
    });
  }
}

function ensnare(s: Stage): void {
  const p = period(s.t, 2.2);
  caster(s);
  const from = s.CX + 26;
  if (p < 0.4) {
    const x = from + (s.TX - from) * (p / 0.4);
    enemy(s);
    s.ctx.lineCap = 'round';
    line(s, x - 24, s.CY, x, s.CY, s.color, 3);
    s.ctx.lineCap = 'butt';
  } else {
    enemy(s);
    disc(s, s.TX, s.CY, 22, s.color, 0.18);
    for (let k = 0; k < 3; k++) {
      const a = s.t * 6 + (k * TAU) / 3;
      s.ctx.globalAlpha = 0.9;
      s.ctx.beginPath();
      s.ctx.arc(s.TX, s.CY, 24, a, a + Math.PI * 0.7);
      s.ctx.lineWidth = 2.5;
      s.ctx.strokeStyle = s.color;
      s.ctx.stroke();
      s.ctx.globalAlpha = 1;
    }
  }
}

function bounce(s: Stage): void {
  enemy(s);
  const p = period(s.t, 2.4);
  const x = 60 + p * (s.W - 120);
  const y = 34 + tri(p * 3) * (s.H - 68);
  s.ctx.globalAlpha = 0.25;
  line(s, x - 18, y - tri(p * 3) * 6, x, y, s.color, 3);
  s.ctx.globalAlpha = 1;
  disc(s, x, y, 6, s.color);
  ring(s, x, y, 6, s.color, 2);
}

function orb(s: Stage): void {
  const p = period(s.t, 3.2);
  const orbR = 44;
  const x = -orbR + p * (s.W + orbR * 2);
  enemy(s, x + orbR + 12, s.CY, 12);
  disc(s, x, s.CY, orbR, s.color, 0.5);
  ring(s, x, s.CY, orbR, s.color, 3);
}

const DRAWERS: Record<string, (s: Stage) => void> = {
  projectile,
  bolt,
  beam,
  beamBig,
  spray,
  swing,
  pull,
  dash,
  blink,
  shield,
  meteor,
  seek,
  drain,
  orbit,
  swirl,
  nova,
  ensnare,
  bounce,
  orb,
};

/** Dessine l'animation du sort correspondant à sa clé `preview`. */
export function drawSpellPreview(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  preview: string,
  color: string,
  t: number,
): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, W, H);
  const stage: Stage = { ctx, W, H, CY: H / 2, CX: 96, TX: W - 120, color, t };
  (DRAWERS[preview] ?? orb)(stage);
}
