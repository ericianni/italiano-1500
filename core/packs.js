/* Word packs (shared core). data/packs/index.json lists packs; each pack has a manifest.json and a words.json.
   Word ids are unique within a pack; ids from packs other than "core" are prefixed "<pack>/" so card keys never collide. */
(function (root, factory) {
  const P = factory();
  if (typeof module === 'object' && module.exports) module.exports = P; else root.Packs = P;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const gid = (pack, id) => pack === 'core' ? id : pack + '/' + id;
  // fetchJSON(url) -> Promise<object>; enabled: Set of pack ids (core is always on)
  async function load(base, fetchJSON, enabled) {
    const idx = await fetchJSON(base + 'index.json');
    const packs = [], words = [];
    for (const p of idx.packs) {
      if (p.id !== 'core' && !(enabled && enabled.has(p.id))) { packs.push(Object.assign({ loaded: false }, p)); continue; }
      const man = await fetchJSON(base + p.path + 'manifest.json');
      const ws = await fetchJSON(base + p.path + man.words);
      ws.forEach(w => { w.pack = p.id; w.id = gid(p.id, w.id); words.push(w); });
      packs.push(Object.assign({ loaded: true, manifest: man }, p));
    }
    return { packs, words };
  }
  return { load, gid };
});
