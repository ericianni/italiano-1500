// Update-flow test: a browser that already has an OLD version installed (service worker + cache) must run the NEW
// version promptly. Serves OLD_DIR, installs it, swaps the served files to this folder (with GitHub Pages-like
// caching headers: max-age=600 + ETag), then counts page loads until the new code runs.
// Usage: node tests/update.js [oldDir [maxLoads]]   (needs google-chrome; default old = this build, renamed; maxLoads 1)
'use strict';
const { spawn } = require('child_process'), http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const NEW = path.join(__dirname, '..'), MAX = +process.argv[3] || 1;
// default "old version": this build with a different cache name and slightly different code (tests the in-app reload)
function prevBuild() {
  const d = fs.mkdtempSync('/tmp/it1500-prev-'), cp = r => { const s = path.join(NEW, r), t = path.join(d, r);
    if (fs.statSync(s).isDirectory()) { if (!/^(tests|tools|build|node_modules|\.git)$/.test(r)) fs.readdirSync(s).forEach(x => cp(path.join(r, x))); }
    else { fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(s, t); } };
  fs.readdirSync(NEW).forEach(cp);
  fs.writeFileSync(path.join(d, 'sw.js'), fs.readFileSync(path.join(d, 'sw.js'), 'utf8').replace(/const CACHE = '([^']+)'/, "const CACHE = '$1-prev'"));
  for (const f of ['app.js', 'lang/it/drills.js']) fs.appendFileSync(path.join(d, f), '\n// previous build\n');
  return d;
}
const OLD = process.argv[2] || prevBuild();
const PORT = +process.env.SMOKE_PORT || 8766, CDP = +process.env.SMOKE_CDP || 9334;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const swCache = d => /const CACHE = '([^']+)'/.exec(fs.readFileSync(path.join(d, 'sw.js'), 'utf8'))[1];
async function main() {
  if (!fs.existsSync(path.join(OLD, 'sw.js'))) throw new Error('usage: node tests/update.js [oldDir [maxLoads]]');
  let root = OLD; const log = [];
  const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p);
    fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); }
      const tag = '"' + crypto.createHash('md5').update(b).digest('hex') + '"'; log.push(p);
      if (q.headers['if-none-match'] === tag) { r.writeHead(304, { etag: tag, 'cache-control': 'max-age=600' }); return r.end(); }
      r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'max-age=600', etag: tag }); r.end(b); }); }).listen(PORT);
  const url = `http://localhost:${PORT}/`;
  const ch = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${CDP}`, '--user-data-dir=/tmp/it1500-update-' + Date.now(), 'about:blank'], { stdio: 'ignore' });
  let fail = '';
  try {
    let tabs; for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); if (tabs.some(t => t.type === 'page')) break; } catch (e) { } await sleep(200); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const wait = {};
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } };
    const send = (method, params) => new Promise(r => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async ex => (await send('Runtime.evaluate', { expression: ex, awaitPromise: true, returnByValue: true })).result.result.value;
    await send('Runtime.enable'); await send('Page.enable');
    // the version the page is actually running = the cache name in the sw.js the page's registration controls, plus the code it loaded
    const probe = `(async()=>{ const r = await navigator.serviceWorker.getRegistration(); const c = await caches.keys();
      const app = await (await fetch('app.js')).text(), d = await (await fetch('lang/it/drills.js')).text();
      return JSON.stringify({ ctl: !!navigator.serviceWorker.controller, caches: c, code: (window.ItDrills ? Object.keys(window.ItDrills).length : 0), app: app.length, drills: d.length }); })()`;
    await send('Page.navigate', { url }); await sleep(3000);
    await send('Page.navigate', { url }); await sleep(2000);
    const o = JSON.parse(await ev(probe)); console.log('old installed:', JSON.stringify(o.caches), 'controlled:', o.ctl);
    if (!o.caches.includes(swCache(OLD))) throw new Error('old version did not install');
    const want = { app: fs.readFileSync(path.join(NEW, 'app.js'), 'utf8').length, drills: fs.readFileSync(path.join(NEW, 'lang/it/drills.js'), 'utf8').length, n: Object.keys(require(path.join(NEW, 'lang/it/drills.js'))).length };
    root = NEW;   // deploy
    let got = 0;
    for (let n = 1; n <= MAX + 2 && !got; n++) {
      await send('Page.navigate', { url }); await sleep(4000);
      const s = JSON.parse(await ev(probe)), live = s.code === want.n && s.app === want.app && s.drills === want.drills;
      console.log(`open #${n}: running ${live ? "NEW" : "old"} code; caches ${JSON.stringify(s.caches)}` + (live ? "" : " " + JSON.stringify(s) + " want " + JSON.stringify(want)));
      if (live) got = n;
    }
    if (!got || got > MAX) fail = `new version took ${got || '>' + (MAX + 2)} opens (want <= ${MAX})`;
  } finally { ch.kill(); srv.close(); }
  if (fail) { console.log('FAIL ' + fail); process.exit(1); }
  console.log('ok  update flow');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
