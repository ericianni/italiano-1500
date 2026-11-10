// Copy the static PWA into www/ so Capacitor bundles it inside the APK (fully offline from first launch).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
const items = ['index.html', 'style.css', 'app.js', 'manifest.webmanifest', 'sw.js', 'core', 'lang', 'data', 'icons', 'fonts'];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const copied = [];
for (const it of items) {
  const src = path.join(root, it);
  if (!fs.existsSync(src)) {
    if (it === 'fonts') continue;
    throw new Error('missing web asset ' + it);
  }
  fs.cpSync(src, path.join(out, it), { recursive: true });
  copied.push(it);
}
console.log('www/ built:', copied.join(', '));
