// Dumps the current ingredient catalog (+ unit family used per ingredient, + grams) as JSON for
// the Python import scripts. Run: npx tsx scripts/import-cmu/export-catalog.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { INGREDIENTS } from '../../src/data/ingredients';
import { GRAMS, USDA_MAP } from '../../src/data/nutrition/usdaMap';
import { RECIPES } from '../../src/data/recipes';

const units: Record<string, string[]> = {};
for (const r of RECIPES) for (const i of r.ingredients) {
  const u = String(i.unit);
  units[i.id] = [...new Set([...(units[i.id] ?? []), u])];
}
const out = Object.values(INGREDIENTS).map((d) => ({ ...d, units: units[d.id] ?? [], grams: GRAMS[d.id] ?? {}, usda: USDA_MAP[d.id] ?? null }));
mkdirSync(`${__dirname}/build`, { recursive: true });
writeFileSync(`${__dirname}/build/catalog.json`, JSON.stringify(out, null, 1));
console.log(`${out.length} ingredients`);
