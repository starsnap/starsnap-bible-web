import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(here, '../../..');
const violations = [];

function walk(directory, extensions) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'build', 'bin', '.gradle', '.git'].includes(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(entryPath, extensions));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) files.push(entryPath);
  }
  return files;
}

function report(file, rule, matches) {
  if (matches.length === 0) return;
  violations.push({
    file: path.relative(workspaceRoot, file).replaceAll('\\', '/'),
    rule,
    matches: [...new Set(matches)].slice(0, 8),
  });
}

const cssFiles = [
  path.join(workspaceRoot, 'starsnap-admin/starsnap-admin-web/src/styles.css'),
  path.join(workspaceRoot, 'starsnap-hub/starsnap-hub-web/src/styles.css'),
];

for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  report(file, 'raw color literal', content.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? []);
  const fontValues = [...content.matchAll(/font-size\s*:\s*([^;]+);/gi)].map((match) => match[1].trim());
  report(file, 'raw font-size', fontValues.filter((value) => !value.includes('var(--ss-')));
  if (!content.includes('@import "./design-tokens.css";')) {
    report(file, 'missing generated token import', ['@import "./design-tokens.css";']);
  }
}

const mainWebRoot = path.join(workspaceRoot, 'starsnap-main/starsnap-web/src');
for (const file of walk(mainWebRoot, ['.ts', '.tsx', '.css'])) {
  if (file.endsWith(path.join('styles', 'tokens.css'))) continue;
  const content = fs.readFileSync(file, 'utf8');
  report(file, 'raw six/eight-digit hex color', content.match(/#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi) ?? []);
  report(file, 'arbitrary Tailwind font-size', content.match(/text-\[[0-9.]+(?:px|rem)\]/gi) ?? []);
}

const androidRoot = path.join(workspaceRoot, 'starsnap-main/starsnap-android');
for (const file of walk(androidRoot, ['.kt'])) {
  if (file.endsWith('StarSnapColor.kt') || file.endsWith('StarSnapTypography.kt')) continue;
  const content = fs.readFileSync(file, 'utf8');
  report(file, 'raw Compose color', content.match(/Color\(0x[0-9a-f]+\)/gi) ?? []);
  report(file, 'raw Compose font-size', content.match(/fontSize\s*=\s*[0-9.]+\.sp/gi) ?? []);
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`${violation.file}: ${violation.rule}: ${violation.matches.join(', ')}`);
  }
  process.exitCode = 1;
} else {
  console.log('Design token usage is consistent across web and Android targets.');
}
