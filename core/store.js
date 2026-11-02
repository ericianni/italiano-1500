/* Versioned localStorage state with export / import (shared core). `fix` fills defaults and migrates. */
(function (root, factory) {
  const S = factory();
  if (typeof module === 'object' && module.exports) module.exports = S; else root.Store = S;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function create(key, fix, storage) {
    const ls = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    return {
      load() { try { const s = JSON.parse(ls.getItem(key)); if (s && s.cards) return fix(s); } catch (e) { /* fresh start */ } return fix({}); },
      save(s) { try { ls.setItem(key, JSON.stringify(s)); return true; } catch (e) { return false; } },
      exportText: s => JSON.stringify(Object.assign({ app: key, exported: new Date().toISOString() }, s)),
      // throws if the text is not a progress export of this app
      importText(t) { const s = JSON.parse(t); if (!s || typeof s !== 'object' || !s.cards || typeof s.cards !== 'object' || (s.app && s.app !== key)) throw new Error('not a progress file'); delete s.exported; return fix(s); },
    };
  }
  return { create };
});
