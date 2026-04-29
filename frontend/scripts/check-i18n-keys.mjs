import { readFileSync } from 'node:fs';

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

const en = JSON.parse(readFileSync('i18n/translate/en.json', 'utf8'));
const km = JSON.parse(readFileSync('i18n/translate/km.json', 'utf8'));

const enFlat = flatten(en);
const kmFlat = flatten(km);

const missingInKm = Object.keys(enFlat).filter((k) => !(k in kmFlat));
const missingInEn = Object.keys(kmFlat).filter((k) => !(k in enFlat));

if (missingInKm.length || missingInEn.length) {
  console.error('i18n key mismatch detected.');
  if (missingInKm.length) {
    console.error('\nMissing in km.json:');
    for (const key of missingInKm) console.error(`- ${key}`);
  }
  if (missingInEn.length) {
    console.error('\nMissing in en.json:');
    for (const key of missingInEn) console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log(`i18n keys OK (${Object.keys(enFlat).length} keys)`);
