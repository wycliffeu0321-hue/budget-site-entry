// HomeLedger entry point for the make.fun household-budget bounty.
// Copies the static site (app/) and its screenshots into the output
// directory, then writes the entry dossier with the vendored builder.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

if (!existsSync(join(here, 'screenshots'))) {
  console.warn('warning: screenshots/ is missing beside main.ts — the dossier will have no images until screenshots are added.');
}

let appFiles = 0;
const countFiles = (dir: string): void => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) countFiles(join(dir, entry.name));
    else if (entry.isFile()) appFiles++;
  }
};

for (const name of ['app', 'screenshots']) {
  const src = join(here, name);
  if (existsSync(src)) {
    cpSync(src, join(out, name), { recursive: true });
    if (name === 'app') countFiles(src);
  }
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(out, 'dossier.json'), dossier);

console.log(`homeledger: copied ${appFiles} app files; dossier.json is ${statSync(join(out, 'dossier.json')).size} bytes in ${out}`);
