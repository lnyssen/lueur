// L'écran de réglages : volumes, indices, vue des énigmes, animations, rejouer une région, tout recommencer.
import { CHAPTERS } from './levels.js';
import { restart } from './save.js';

export function initSettings(game, sound) {
  const st = game.state;
  const $ = id => document.getElementById(id);
  const panel = $('settings');
  let armed = false;

  function render() {
    $('opt-music').value = Math.round(st.opts.music * 100);
    $('opt-sfx').value = Math.round(st.opts.sfx * 100);
    $('opt-calm').checked = st.opts.calm;
    for (const b of panel.querySelectorAll('[data-opt]')) {
      b.setAttribute('aria-pressed', String(st.opts[b.dataset.opt] === b.dataset.val));
    }
    const list = $('opt-chapters');
    list.textContent = '';
    CHAPTERS.forEach((ch, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${i + 1} · ${ch.name}`;
      b.disabled = i > (st.best | 0) && i !== st.chapter;
      if (i === st.chapter) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => {
        Object.assign(st, { chapter: i, x: 120, berries: false, bridge: false, stage: 0, lit: false });
        game.save();
        close();
        game.go('road');
      });
      list.append(b);
    });
    $('opt-restart').textContent = armed ? 'Appuie encore pour tout effacer' : 'Recommencer l’aventure';
    $('opt-restart').classList.toggle('armed', armed);
  }

  function open() {
    armed = false;
    render();
    panel.hidden = false;
    $('opt-close').focus();
  }
  function close() {
    panel.hidden = true;
  }

  $('gear').addEventListener('click', () => {
    sound.start();
    open();
  });
  $('opt-close').addEventListener('click', close);
  panel.addEventListener('click', e => {
    if (e.target === panel) close();
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) close();
  });

  const volumes = () => {
    st.opts.music = $('opt-music').value / 100;
    st.opts.sfx = $('opt-sfx').value / 100;
    sound.setVolumes(st.opts.music, st.opts.sfx);
    game.save();
  };
  $('opt-music').addEventListener('input', volumes);
  $('opt-sfx').addEventListener('input', volumes);
  $('opt-sfx').addEventListener('change', () => sound.play('pickup'));

  for (const b of panel.querySelectorAll('[data-opt]')) {
    b.addEventListener('click', () => {
      st.opts[b.dataset.opt] = b.dataset.val;
      game.save();
      render();
    });
  }
  $('opt-calm').addEventListener('change', e => {
    st.opts.calm = e.target.checked;
    game.save();
  });
  $('opt-restart').addEventListener('click', () => {
    if (!armed) {
      armed = true;
      render();
      return;
    }
    restart(st);
    location.href = location.pathname;
  });

  return { isOpen: () => !panel.hidden };
}
