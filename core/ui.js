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
      b.onclick = () => { const a = t.selectionStart ?? t.value.length, z = t.selectionEnd ?? a; t.setRangeText(b.dataset.c, a, z, 'end'); t.dispatchEvent(new Event('input')); t.focus({ preventScroll: true }); };
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
  // cheat-sheet chip bar: sticky at the top of its scroller (the page, or the overlay over a drill), scrolls sideways when it
  // overflows; tapping a chip smooth-scrolls to its section (scroll-margin-top keeps it clear of the bar), and the chip of
  // the section being read is highlighted as you scroll
  function bindJump(root) {
    const bar = root.querySelector('.jump'); if (!bar) return;
    const sc = root.classList.contains('ovbody') ? root : window, links = [...bar.querySelectorAll('a')];
    const tg = links.map(a => root.querySelector('#' + CSS.escape(a.getAttribute('href').slice(1))));
    let lock = null, lockT = 0, raf = 0;
    const setH = () => root.style.setProperty('--jh', bar.offsetHeight + 'px');
    const mark = a => {
      if (a && a.classList.contains('on')) return;
      links.forEach(x => { x.classList.toggle('on', x === a); if (x === a) x.setAttribute('aria-current', 'location'); else x.removeAttribute('aria-current'); });
      if (a && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: Math.max(0, a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2), behavior: 'smooth' });
    };
    const spy = () => {
      if (!bar.isConnected) return off();
      if (lock && Date.now() < lockT) return mark(lock);
      lock = null;
      const y = bar.getBoundingClientRect().bottom + 12, last = tg.length - 1;
      let cur = links[0];
      tg.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= y) cur = links[i]; });
      const end = sc === window ? innerHeight + scrollY >= document.documentElement.scrollHeight - 4 : sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4;
      if (end && tg[last] && tg[last].getBoundingClientRect().top < (sc === window ? innerHeight : sc.getBoundingClientRect().bottom)) cur = links[last];   // a short last section can't reach the top
      mark(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; spy(); }); };
    // a tapped chip stays current until its section has arrived under the bar (or the page can't scroll further), so a
    // stray scrollend or a long smooth scroll can't flash another chip
    const reached = () => {
      const t = tg[links.indexOf(lock)]; if (!t) return true;
      const d = t.getBoundingClientRect().top - bar.getBoundingClientRect().bottom;
      const end = sc === window ? innerHeight + scrollY >= document.documentElement.scrollHeight - 4 : sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4;
      return Math.abs(d - 8) < 16 || (end && d > 0);
    };
    const onEnd = () => { if (lock && reached()) { lockT = 0; spy(); } };
    const onResize = () => { setH(); onScroll(); };
    function off() { sc.removeEventListener('scroll', onScroll); sc.removeEventListener('scrollend', onEnd); removeEventListener('resize', onResize); }
    sc.addEventListener('scroll', onScroll, { passive: true }); sc.addEventListener('scrollend', onEnd); addEventListener('resize', onResize);
    links.forEach((a, i) => a.onclick = e => {
      e.preventDefault(); const t = tg[i]; if (!t) return;
      for (let p = t; p && p !== root; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;   // a collapsed section opens
      lock = a; lockT = Date.now() + 3000; mark(a);
      t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    setH(); spy();
  }
  const chips = (g, opts, on) => `<div class="chips" data-g="${g}">${opts.map(([v, l]) => `<button data-v="${esc(v)}" class="${on.includes(v) ? 'on' : ''}" aria-pressed="${on.includes(v)}">${esc(l)}</button>`).join('')}</div>`;
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${esc(v)}" class="${String(cur) === String(v) ? 'on' : ''}" aria-pressed="${String(cur) === String(v)}">${esc(l)}</button>`).join('')}</div>`;
  function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
  root.UI = { $, $$, esc, shuffle, keyRow, bindTyped, focusNext, rwButtons, afterTyped, bindRW, openOverlay, closeOverlay, gotoAnchor, bindJump, chips, seg, download };
})(typeof self !== 'undefined' ? self : this);
