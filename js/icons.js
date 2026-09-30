// Les icônes de l'interface : un seul style (trait fin, bouts ronds, grille de 24) et un seul bouton rond.
const PATHS = {
  restart: 'M3 4v6h6 M3.6 15a9 9 0 1 0 2.1-9.4L3 10',
  expand: 'M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M16 21h3a2 2 0 0 0 2-2v-3 M3 16v3a2 2 0 0 0 2 2h3',
  shrink: 'M8 3v3a2 2 0 0 1-2 2H3 M21 8h-3a2 2 0 0 1-2-2V3 M3 16h3a2 2 0 0 1 2 2v3 M16 21v-3a2 2 0 0 1 2-2h3',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z M9 7h6',
  home: 'M3 11l9-8 9 8 M5 9.5V21h14V9.5 M10 21v-6h4v6',
  next: 'M9 5l7 7-7 7',
  back: 'M15 5l-7 7 7 7',
};
const cache = {};

export function uiButton(ctx, x, y, name, { r = 20, active = false, glowing = false } = {}) {
  if (glowing) {
    const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 2.2);
    g.addColorStop(0, 'rgba(255,214,130,0.4)');
    g.addColorStop(1, 'rgba(255,214,130,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = active ? 'rgba(255,214,130,0.32)' : 'rgba(22,20,44,0.38)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgba(255,244,215,${active ? 0.9 : 0.4})`;
  ctx.stroke();
  const k = r / 20;
  ctx.save();
  ctx.translate(x - 10 * k, y - 10 * k);
  ctx.scale((20 * k) / 24, (20 * k) / 24);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff4d7';
  ctx.stroke(cache[name] || (cache[name] = new Path2D(PATHS[name])));
  ctx.restore();
}
