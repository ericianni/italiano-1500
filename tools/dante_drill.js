/* Mark Dante cards the morphology engine cannot build, and store the plural it would grade. */
const fs = require('fs');
const M = require('../lang/it/morph.js');
const path = process.argv[2];
const words = JSON.parse(fs.readFileSync(path, 'utf8'));
for (const w of words) {
  if (w.nodrill) continue;
  if (w.pos === 'n' && (w.g === 'm' || w.g === 'f')) {
    try {
      const r = M.nounPlural({ it: w.it, g: w.g });
      if (!r || !r.pl) { w.nodrill = true; continue; }
      w.pl = r.pl;
      if (r.g && r.g !== w.g) w.plg = r.g;
    } catch (e) { w.nodrill = true; }
  } else if (w.pos === 'v' && w.conj) {
    try {
      const v = { it: w.it, conj: w.conj, aux: w.aux || 'a' };
      if (!M.tense(v, 'pres') || !M.tense(v, 'imp') || !M.tense(v, 'fut') || !M.pastPart(v)) w.nodrill = true;
    } catch (e) { w.nodrill = true; }
  } else w.nodrill = true;
}
fs.writeFileSync(path, JSON.stringify(words, null, 1) + '\n');
const drill = words.filter(w => !w.nodrill).length;
console.log('drillable', drill, 'of', words.length);
