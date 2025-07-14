// Unit test for i18n dictionaries structure
// Перевіряє, що всі словники мають однакову структуру ключів

const en = require('../../svelte-app/src/lib/i18n/en.js').default;
const uk = require('../../svelte-app/src/lib/i18n/uk.js').default;
const crh = require('../../svelte-app/src/lib/i18n/crh.js').default;
const nl = require('../../svelte-app/src/lib/i18n/nl.js').default;

/**
 * Рекурсивно збирає всі ключі (включаючи вкладені) у вигляді 'section.key.subkey'
 */
function collectKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(collectKeys(obj[k], prefix ? `${prefix}.${k}` : k));
    } else {
      keys.push(prefix ? `${prefix}.${k}` : k);
    }
  }
  return keys;
}

describe('i18n dictionaries', () => {
  const dicts = { en, uk, crh, nl };
  const dictNames = Object.keys(dicts);
  const baseKeys = collectKeys(en);

  for (const [lang, dict] of Object.entries(dicts)) {
    it(`should have all keys for ${lang}`, () => {
      const keys = collectKeys(dict);
      expect(new Set(keys)).toEqual(new Set(baseKeys));
    });
  }

  it('should have the same top-level sections in all languages', () => {
    const sections = Object.keys(en);
    for (const [lang, dict] of Object.entries(dicts)) {
      expect(Object.keys(dict)).toEqual(sections);
    }
  });
}); 