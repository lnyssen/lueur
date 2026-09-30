import { load, save, wipe } from './save.js';
import { Road } from './road.js';
import { Camp } from './camp.js';
import { Diorama } from './diorama.js';
import { Ending } from './ending.js';
import { Sound } from './audio.js';
import { CHAPTERS } from './levels.js';
import { initSettings } from './settings.js';

// Paramètres de test : ?reset, ?chapter=0..4, ?scene=road|camp|diorama, ?stage=0..2, ?lit
const q = new URLSearchParams(location.search);
if (q.has('reset')) wipe();
const state = load();
if (q.has('chapter')) state.chapter = +q.get('chapter');
if (q.get('scene')) state.scene = q.get('scene');
if (q.has('stage')) state.stage = +q.get('stage');
if (q.has('lit')) state.lit = true;
state.chapter = Math.max(0, Math.min(CHAPTERS.length - 1, state.chapter | 0));

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const view = { w: 0, h: 0, dpr: 1 };
const fade = { a: 1, to: null };
const sound = new Sound(state.opts);
const title = document.getElementById('title');

const game = {
  state,
  view,
  save: () => save(state),
  sfx: name => sound.play(name),
  mood: (lit, chapter = state.chapter) => sound.mood(chapter, lit),
  go(name) {
    if (!fade.to) fade.to = name;
  },
  // Le nom du chapitre, affiché le temps de se mettre en route.
  announce() {
    game.say(`chapitre ${state.chapter + 1} · ${CHAPTERS[state.chapter].name}`);
  },
  say(text) {
    title.querySelector('p').textContent = text;
    title.hidden = false;
    title.classList.remove('gone');
    titleAt = performance.now();
  },
};
let titleAt = 0;
const hideTitle = () => {
  if (performance.now() - titleAt > 600) title.classList.add('gone');
};

const scenes = {
  road: () => new Road(game),
  camp: () => new Camp(game),
  diorama: () => new Diorama(game),
  ending: () => new Ending(game),
};
let scene = (scenes[state.scene] || scenes.road)();

function resize() {
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  canvas.width = Math.round(view.w * view.dpr);
  canvas.height = Math.round(view.h * view.dpr);
  canvas.style.width = view.w + 'px';
  canvas.style.height = view.h + 'px';
}
window.addEventListener('resize', resize);
resize();

const settings = initSettings(game, sound);

canvas.addEventListener('pointerdown', e => {
  hideTitle();
  sound.start();
  canvas.setPointerCapture(e.pointerId);
  scene.pointer('down', e.clientX, e.clientY);
});
canvas.addEventListener('pointermove', e => scene.pointer('move', e.clientX, e.clientY));
canvas.addEventListener('pointerup', e => scene.pointer('up', e.clientX, e.clientY));
canvas.addEventListener('pointercancel', e => scene.pointer('up', e.clientX, e.clientY));
window.addEventListener('keydown', e => {
  hideTitle();
  sound.start();
  if (e.key === 'Tab') e.preventDefault();
  if (settings.isOpen()) return;
  if (!e.repeat) scene.key?.('down', e.key);
});
window.addEventListener('keyup', e => scene.key?.('up', e.key));

function tick(dt) {
  if (fade.to) {
    fade.a += dt / (state.opts.calm ? 0.2 : 0.55);
    if (fade.a >= 1) {
      fade.a = 1;
      state.scene = fade.to;
      scene = scenes[fade.to]();
      save(state);
      fade.to = null;
    }
  } else if (fade.a > 0) {
    fade.a = Math.max(0, fade.a - dt / (state.opts.calm ? 0.25 : 0.8));
  }

  scene.update(dt);
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  scene.draw(ctx);
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  if (fade.a > 0) {
    ctx.fillStyle = `rgba(24,22,48,${fade.a})`;
    ctx.fillRect(0, 0, view.w, view.h);
  }
}

let last = performance.now();
function frame(now) {
  tick(Math.min(0.05, (now - last) / 1000));
  last = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// Pour tester à la main depuis la console : lueur.step(2) avance de deux secondes.
window.lueur = {
  game,
  sound,
  get scene() { return scene; },
  step(seconds) {
    for (let i = 0; i < seconds * 30; i++) tick(1 / 30);
  },
};
