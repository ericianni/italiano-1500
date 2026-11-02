/* Small DOM helpers shared by the app shell (language-agnostic): escaping, typed answers with
   extra-letter keys, Right/Wrong buttons, the slide-over cheat sheet, and chip rows. */
(function (root) {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // a row of keys that insert characters the phone keyboard may hide (à è é ì ò ù ’)
  const keyRow = chars => `<div class="mac" id="mac">${chars.map(c => `<button type="button" data-c="${esc(c)}" aria-label="type ${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
  // Enter submits; the keys insert at the caret without stealing focus (so the mobile keyboard stays up)
  function bindTyped(go) {
    const t = $('#typed'); if (!t) return;
    t.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };
    $$('#mac button').forEach(b => {
      b.onpointerdown = e => e.preventDefault();
      b.onclick = () => { const a = t.selectionStart ?? t.value.length, z = t.selectionEnd ?? a; t.setRangeText(b.dataset.c, a, z, 'end'); t.focus({ preventScroll: true }); };
    });
    t.focus({ preventScroll: true });
  }
  const focusNext = () => { const b = $('#ans .primary'); if (b && matchMedia('(hover:hover)').matches) b.focus({ preventScroll: true }); };
  const rwButtons = nextTxt => `<div class="grades"><button class="g0" data-r="0">✗ Wrong<small>see again soon</small></button><button class="g2" data-r="1">✓ Right<small>next ${esc(nextTxt)}</small></button></div>`;
  const afterTyped = ok => `<div class="row" style="margin-top:14px">${ok ? '<button class="primary big" data-r="1">Next</button>' : '<button class="grow" data-r="1">Count as correct</button><button class="primary grow" data-r="0">Next</button>'}</div>`;
  function bindRW(cb) { $$('#ans button[data-r]').forEach(b => b.onclick = () => cb(b.dataset.r === '1')); }
  // overlay panel (cheat sheet over a drill)
  function openOverlay(title, html, onBind) {
    closeOverlay();
    const o = document.createElement('div'); o.id = 'overlay';
    o.innerHTML = `<div class="ovtop"><b class="grow">${esc(title)}</b><button id="ovx">Back ✕</button></div><div class="ovbody sheet">${html}</div>`;
    document.body.appendChild(o); document.body.style.overflow = 'hidden';
    $('#ovx').onclick = closeOverlay;
    if (onBind) onBind(o.querySelector('.ovbody'));
  }
  function closeOverlay() { const o = $('#overlay'); if (o) o.remove(); document.body.style.overflow = ''; }
  // open the <details> containing #id, flash it, scroll to it
  function gotoAnchor(rootEl, id) {
    const el = id && rootEl.querySelector('#' + CSS.escape(id)); if (!el) return;
    for (let p = el; p && p !== rootEl; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
    if (el.tagName === 'DETAILS') el.open = true;
    el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600);
    el.scrollIntoView({ block: 'start' });
  }
  const bindJump = rootEl => rootEl.querySelectorAll('.jump a').forEach(x => x.onclick = e => { e.preventDefault(); gotoAnchor(rootEl, x.getAttribute('href').slice(1)); });
  const chips = (g, opts, on) => `<div class="chips" data-g="${g}">${opts.map(([v, l]) => `<button data-v="${esc(v)}" class="${on.includes(v) ? 'on' : ''}" aria-pressed="${on.includes(v)}">${esc(l)}</button>`).join('')}</div>`;
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${esc(v)}" class="${String(cur) === String(v) ? 'on' : ''}" aria-pressed="${String(cur) === String(v)}">${esc(l)}</button>`).join('')}</div>`;
  function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
  root.UI = { $, $$, esc, shuffle, keyRow, bindTyped, focusNext, rwButtons, afterTyped, bindRW, openOverlay, closeOverlay, gotoAnchor, bindJump, chips, seg, download };
})(typeof self !== 'undefined' ? self : this);
