// Headless browser smoke test: serves the app, drives every tab in Chrome over the DevTools protocol, fails on any JS error.
// Usage: node tests/smoke.js [url]   (default: serves this folder on :8765). Needs google-chrome.
'use strict';
const { spawn } = require('child_process'), http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), PORT = +process.env.SMOKE_PORT || 8765, CDP = +process.env.SMOKE_CDP || 9333;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function main() {
  let url = process.argv[2], srv;
  if (!url) {
    srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p);
      fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(b); }); }).listen(PORT);
    url = `http://localhost:${PORT}/`;
  }
  const ch = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${CDP}`, '--user-data-dir=/tmp/it1500-smoke-' + Date.now(), '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
  let tabs; for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); break; } catch (e) { await sleep(200); } }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const wait = {}, errors = [];
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception ? d.params.exceptionDetails.exception.description : d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map(a => a.value || a.description).join(' ')); };
  const send = (method, params) => new Promise(r => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(expr.slice(0, 80) + ': ' + r.result.exceptionDetails.exception.description); return r.result.result.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url }); await sleep(2500);
  const results = []; const step = async (name, expr) => { try { const v = await ev(expr); results.push([name, v]); } catch (e) { errors.push(name + ': ' + e.message); } };
  const click = sel => `(()=>{const b=document.querySelector(${JSON.stringify(sel)}); if(!b) throw new Error('missing ${sel.replace(/'/g, '')}'); b.click(); return true})()`;
  await step('title', 'document.title');
  await step('loaded words', 'window.__it1500.W.length');
  // flashcards: answer 12 cards, alternating right/wrong, typing on production cards
  await step('cards', `(async()=>{const A=window.__it1500; A.setTab('today'); document.querySelector('#go').click(); let n=0;
    for(let i=0;i<12;i++){ const s=document.querySelector('#show'); if(!s) break; s.click(); const b=document.querySelector('#ans button[data-r="'+(i%3?1:0)+'"]')||document.querySelector('#ans button[data-r]'); b.click(); n++; }
    return n+' answered; started '+Object.keys(A.S.cards).length+' cards'})()`);
  // drills: type mode, identify mode, mix
  for (const mode of ['type', 'id', 'mix']) await step('drills ' + mode, `(async()=>{const A=window.__it1500; A.S.set.dmode='${mode}'; A.setTab('drills'); document.querySelector('#dgo').click(); let n=0, kinds={};
    for(let i=0;i<40;i++){ const chk=document.querySelector('#chk'); if(!chk) break; const typed=document.querySelector('#typed');
      if(typed){ typed.value='xx'; chk.click(); } else { document.querySelectorAll('#idrows .idrow').forEach(r=>r.querySelector('button').click()); if(document.querySelector('#chk') && !document.querySelector('#chk').disabled) document.querySelector('#chk').click(); }
      kinds[document.querySelector('.prompt-kind').textContent.split(' ')[0]]=1; const nx=[...document.querySelectorAll('#ans button[data-r]')].pop(); nx.click(); n++; }
    return n+' answered, end screen: '+(document.querySelector('h2')||{}).textContent})()`);
  await step('weak spots', `(()=>{window.__it1500.setTab('drills'); document.querySelector('#gweak').click(); return document.querySelectorAll('table.weak tr').length-1})()`);
  await step('drill settings', `(()=>{window.__it1500.setTab('drills'); document.querySelector('#tset').click(); const b=document.querySelector('.chips[data-g="tenses"] button'); b.click(); const t=document.querySelector('#view').textContent.match(/(\\d+) forms/)[1]; document.querySelector('.chips[data-g="tenses"] button').click(); return t+' forms after toggling one tense'})()`);
  // regression: a single selected tense (or any single option) is the only one offered and comes pre-selected in Identify;
  // settings are set through the UI, survive a reload, and apply to the next set and to weak-spot practice
  await step('settings: only passato prossimo + identify', `(()=>{const A=window.__it1500; A.setTab('drills'); if(!document.querySelector('#dset')) document.querySelector('#tset').click();
    for(const g of ['types','tenses']) for(const b of document.querySelectorAll('.chips[data-g="'+g+'"] button')) { const keep = g==='types' ? 'verb' : 'pp'; if((b.getAttribute('aria-pressed')==='true') !== (b.dataset.v===keep)) document.querySelector('.chips[data-g="'+g+'"] button[data-v="'+b.dataset.v+'"]').click(); }
    document.querySelector('#dmode button[data-v="id"]').click(); return JSON.stringify(A.S.set.df.tenses)+' '+A.S.set.dmode})()`);
  await send('Page.reload', {}); await sleep(2500);
  const onlyPP = `(()=>{ let n=0; const bad=[];
    for(let i=0;i<40;i++){ const chk=document.querySelector('#chk'); if(!chk) break;
      if(document.querySelector('#typed')) { bad.push('typed question'); break; }
      const kick=document.querySelector('.prompt-kind').textContent, tb=[...document.querySelectorAll('.idrow[data-a="t"] button')];
      if(!/Passato prossimo/.test(kick)) bad.push('kicker '+kick);
      if(tb.length!==1 || tb[0].dataset.v!=='pp' || !tb[0].classList.contains('on') || !tb[0].disabled) bad.push('tense row '+tb.map(b=>b.dataset.v+(b.classList.contains('on')?'*':'')).join(','));
      if(!chk.disabled) bad.push('check enabled before picking the person');
      document.querySelector('.idrow[data-a="p"] button').click();   // picking the person alone answers it
      const nx=[...document.querySelectorAll('#ans button[data-r]')].pop(); if(!nx) { bad.push('person pick did not answer'); break; } nx.click(); n++; }
    return n+' answered'+(bad.length?' BAD: '+bad.slice(0,3).join(' | '):'')})()`;
  await step('only passato prossimo (after reload)', `(()=>{const A=window.__it1500; if(A.S.set.dmode!=='id'||A.S.set.df.tenses.join()!=='pp') throw new Error('settings not persisted: '+JSON.stringify(A.S.set)); A.setTab('drills'); document.querySelector('#dgo').click(); const r=${onlyPP}; if(/BAD|^0 /.test(r)) throw new Error(r); return r})()`);
  await step('only passato prossimo: weak spots', `(()=>{const A=window.__it1500; A.setTab('drills'); document.querySelector('#gweak').click(); const g=document.querySelector('#wgo'); if(!g) return 'no weak spots'; g.click(); const r=${onlyPP}; if(/BAD|^0 /.test(r)) throw new Error(r); return r})()`);
  // click chips until each listed group has exactly the given values on (settings panel open)
  const setChips = o => `if(!document.querySelector('#dset')) document.querySelector('#tset').click(); const o=${JSON.stringify(o)};
    for(const g of Object.keys(o)) for(const v of [...document.querySelectorAll('.chips[data-g="'+g+'"] button')].map(b=>b.dataset.v)) { const b=document.querySelector('.chips[data-g="'+g+'"] button[data-v="'+v+'"]');
      if((b.getAttribute('aria-pressed')==='true') !== o[g].includes(v)) b.click(); }`;
  await step('only noi (1st person plural), identify', `(()=>{const A=window.__it1500; A.setTab('drills'); ${setChips({ types: ['verb'], tenses: ['pres', 'pp', 'imp', 'fut'], persons: ['1'], vnums: ['p'] })}
    if(A.S.set.df.persons.join()!=='1'||A.S.set.df.vnums.join()!=='p') throw new Error('chips: '+JSON.stringify(A.S.set.df)); document.querySelector('#dgo').click(); let n=0; const bad=[];
    for(let i=0;i<40;i++){ const chk=document.querySelector('#chk'); if(!chk) break; if(document.querySelector('#typed')) { bad.push('typed'); break; }
      const pb=[...document.querySelectorAll('.idrow[data-a="p"] button')], tb=[...document.querySelectorAll('.idrow[data-a="t"] button')];
      if(pb.length!==1||pb[0].dataset.v!=='1p'||!pb[0].classList.contains('on')||!pb[0].disabled||!document.querySelector('.idrow.fixed[data-a="p"]')) bad.push('person row '+pb.map(b=>b.dataset.v).join(','));
      if(tb.length!==4||tb.some(b=>b.disabled)) bad.push('tense row '+tb.length); if(!chk.disabled) bad.push('check enabled early');
      tb[0].click(); const nx=[...document.querySelectorAll('#ans button[data-r]')].pop(); if(!nx){ bad.push('tense pick did not answer'); break; } nx.click(); n++; }
    const r=n+' answered'+(bad.length?' BAD: '+[...new Set(bad)].slice(0,3).join(' | '):''); if(/BAD|^0 /.test(r)) throw new Error(r); return r})()`);
  await step('only feminine articles, identify', `(()=>{const A=window.__it1500; A.setTab('drills'); ${setChips({ types: ['art'], agen: ['f'] })} document.querySelector('#dgo').click(); let n=0, typed=0; const bad=[];
    for(let i=0;i<40;i++){ const chk=document.querySelector('#chk'); if(!chk) break;
      if(document.querySelector('#typed')) { const k=document.querySelector('.prompt-kind').textContent; typed++; document.querySelector('#typed').value='x'; chk.click(); }
      else { const ab=[...document.querySelectorAll('.idrow[data-a="a"] button')].map(b=>b.dataset.v); if(ab.some(a=>!["la","l'","le","una","un'"].includes(a))) bad.push('articles '+ab.join(',')); document.querySelector('.idrow[data-a="a"] button').click(); }
      const nx=[...document.querySelectorAll('#ans button[data-r]')].pop(); if(!nx){ bad.push('no answer'); break; } nx.click(); n++; }
    const r=n+' answered ('+typed+' typed)'+(bad.length?' BAD: '+[...new Set(bad)].slice(0,3).join(' | '):''); if(/BAD|^0 /.test(r)) throw new Error(r); return r})()`);
  // reported live: only Present selected, Identify still offered all four tenses (set of 10, new word / new form)
  await step('only present, identify, set of 10', `(()=>{const A=window.__it1500; A.setTab('drills'); ${setChips({ types: ['verb', 'art', 'agr'], tenses: ['pres'], persons: ['1', '2', '3'], vnums: ['s', 'p'], agen: ['m', 'f'] })}
    document.querySelector('#dmode button[data-v="id"]').click(); document.querySelector('#sdr button[data-v="10"]').click(); document.querySelector('#dgo').click(); let n=0, v=0; const bad=[];
    for(let i=0;i<40;i++){ const chk=document.querySelector('#chk'); if(!chk) break;
      if(document.querySelector('#typed')) { document.querySelector('#typed').value='x'; chk.click(); }
      else { const tb=[...document.querySelectorAll('.idrow[data-a="t"] button')];
        if(tb.length){ v++; if(tb.length!==1||tb[0].dataset.v!=='pres'||!tb[0].classList.contains('on')||!tb[0].disabled) bad.push('tense row '+tb.map(b=>b.dataset.v).join(',')); if(document.querySelectorAll('.idrow[data-a="p"] button').length!==6) bad.push('persons'); }
        document.querySelectorAll('#idrows .idrow:not(.fixed)').forEach(r=>r.querySelector('button').click()); const c2=document.querySelector('#chk'); if(c2 && !c2.disabled) c2.click(); }
      const nx=[...document.querySelectorAll('#ans button[data-r]')].pop(); if(!nx){ bad.push('no answer'); break; } nx.click(); n++; }
    const r=n+' answered, '+v+' verb questions'+(bad.length?' BAD: '+[...new Set(bad)].slice(0,3).join(' | '):''); if(/BAD/.test(r)||n<10||!v||A.S.set.dlen!==10) throw new Error(r); return r})()`);
  await step('settings restored', `(()=>{const A=window.__it1500; A.setTab('drills'); if(!document.querySelector('#dset')) document.querySelector('#tset').click();
    for(const g of Object.keys(A.S.set.df)) for(const b of document.querySelectorAll('.chips[data-g="'+g+'"] button')) if(b.getAttribute('aria-pressed')!=='true') document.querySelector('.chips[data-g="'+g+'"] button[data-v="'+b.dataset.v+'"]').click();
    document.querySelector('#dmode button[data-v="type"]').click(); const D=window.ItDrills; if(D && Object.keys(D.DF).some(g=>A.S.set.df[g].length!==D.DF[g].length)) throw new Error('not restored '+JSON.stringify(A.S.set.df)); return Object.keys(A.S.set.df).length+' groups all on'})()`);
  await step('cheat overlay', `(()=>{window.__it1500.openSheet('cs-pp'); const o=document.querySelector('#overlay'); const r=!!o && document.querySelector('#cs-pp').open; document.querySelector('#ovx').click(); return r && !document.querySelector('#overlay')})()`);
  await step('learn', `(async()=>{const A=window.__it1500; A.setTab('learn'); const ids=[...document.querySelectorAll('.lrow')].map(b=>b.dataset.l); let tot=0;
    for(const id of ids){ A.openLesson(id); document.querySelector('#lq').click(); for(let i=0;i<12;i++){ const o=document.querySelector('.opts button'); if(o){o.click();} else { const t=document.querySelector('#typed'); if(!t) break; t.value='x'; document.querySelector('#chk').click(); }
      const n=document.querySelector('#qnext'); if(n) n.click(); else break; tot++; } }
    return ids.length+' lessons, '+tot+' quiz questions, done: '+Object.keys(A.S.lessons).length})()`);
  await step('lesson practice', `(()=>{const A=window.__it1500; A.openLesson('l-pp'); document.querySelector('#ldr').click(); return document.querySelector('.prompt-kind').textContent})()`);
  await step('cheat tab', `(()=>{window.__it1500.setTab('cheat'); return document.querySelectorAll('details.cs').length+' sections, '+document.querySelectorAll('.sheet td').length+' cells'})()`);
  await step('word list', `(()=>{window.__it1500.setTab('list'); const n1=document.querySelectorAll('#ll li').length; const q=document.querySelector('#lq'); q.value='andare'; q.dispatchEvent(new Event('input')); document.querySelector('#ll li[data-id]').click(); return n1+' rows; andare detail: '+document.querySelector('.det').textContent.slice(0,120)})()`);
  await step('about', `(()=>{window.__it1500.setTab('about'); return [...document.querySelectorAll('a')].map(a=>a.href).filter(h=>/FrequencyWords|creativecommons/.test(h)).length+' source/license links'})()`);
  await step('export/import', `(()=>{const A=window.__it1500; const s=Store.create('italiano1500.v1', x=>x).exportText(A.S); return JSON.parse(s).app})()`);
  await step('sw', `navigator.serviceWorker.getRegistration().then(r=>r? 'registered':'none').then(async x=>x+' / caches: '+(await caches.keys()).join(','))`);
  for (const [n, v] of results) console.log('ok  ' + n + ': ' + JSON.stringify(v));
  for (const e of errors) console.log('ERR ' + e);
  ws.close(); ch.kill(); if (srv) srv.close();
  process.exit(errors.length ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
