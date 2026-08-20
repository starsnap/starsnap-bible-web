import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(here, '../../..');
const tokens = JSON.parse(fs.readFileSync(path.join(here, 'tokens.json'), 'utf8'));

const generatedHeader = '/* AUTO-GENERATED from /starsnap-main/starsnap-web/design-system/tokens.json. Do not edit directly. */';
const colorPrimitives = tokens.color.primitive;
const semanticColors = tokens.color.semantic;

const kebab = (value) => value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const cssColorVar = (reference) => {
  const [group, shade] = reference.split('.');
  return `var(--ss-${kebab(group)}-${kebab(shade)})`;
};
const resolveColor = (reference) => {
  const [group, shade] = reference.split('.');
  return colorPrimitives[group][shade];
};
const composeColor = (hex) => `0xFF${hex.slice(1).toUpperCase()}`;
const kotlinName = (value) => value;
const fontWeightName = {
  regular: 'Normal',
  medium: 'Medium',
  semibold: 'SemiBold',
  bold: 'Bold',
};

function generateCss() {
  const lines = [generatedHeader, ':root {', '  /* Primitive colors */'];

  for (const [group, shades] of Object.entries(colorPrimitives)) {
    for (const [shade, value] of Object.entries(shades)) {
      lines.push(`  --ss-${kebab(group)}-${kebab(shade)}: ${value};`);
    }
  }

  lines.push('', '  /* Primitive typography */');
  lines.push(`  --ss-font-sans: ${tokens.typography.family.sans};`);
  lines.push(`  --ss-font-mono: ${tokens.typography.family.mono};`);
  for (const [name, value] of Object.entries(tokens.typography.size)) {
    lines.push(`  --ss-font-size-${kebab(name)}: ${value.rem};`);
  }
  for (const [name, value] of Object.entries(tokens.typography.weight)) {
    lines.push(`  --ss-font-weight-${kebab(name)}: ${value};`);
  }
  for (const [name, value] of Object.entries(tokens.typography.lineHeight)) {
    lines.push(`  --ss-line-height-${kebab(name)}: ${value};`);
  }

  lines.push('', '  /* Primitive spacing, geometry, and motion */');
  for (const [name, value] of Object.entries(tokens.space)) lines.push(`  --ss-space-${name}: ${value};`);
  for (const [name, value] of Object.entries(tokens.radius)) lines.push(`  --ss-radius-${name}: ${value};`);
  lines.push('  --ss-shadow-sm: 0 1px 2px rgb(23 27 36 / 0.05);');
  lines.push('  --ss-shadow-md: 0 12px 32px rgb(23 27 36 / 0.09);');
  lines.push('  --ss-shadow-lg: 0 20px 48px rgb(23 27 36 / 0.14);');
  lines.push(`  --ss-duration-fast: ${tokens.motion.fast};`);
  lines.push(`  --ss-duration-normal: ${tokens.motion.normal};`);
  lines.push(`  --ss-ease-standard: ${tokens.motion.ease};`);

  lines.push('', '  /* Semantic colors */');
  for (const [name, reference] of Object.entries(semanticColors)) {
    lines.push(`  --ss-${kebab(name)}: ${cssColorVar(reference)};`);
  }
  lines.push('  --ss-focus-ring: rgb(245 214 59 / 0.42);');
  lines.push('  --ss-overlay: rgb(23 27 36 / 0.5);');
  lines.push('  --ss-shadow-color-soft: rgb(23 27 36 / 0.06);');
  lines.push('  --ss-shadow-color: rgb(23 27 36 / 0.12);');
  lines.push('  --ss-shadow-color-strong: rgb(23 27 36 / 0.24);');
  lines.push('  --ss-surface-translucent: rgb(255 255 255 / 0.86);');
  lines.push('  --ss-brand-glow: rgb(255 229 91 / 0.16);');
  lines.push('  --ss-success-glow: rgb(5 150 105 / 0.12);');
  lines.push('  --ss-info-border-alpha: rgb(191 219 254 / 0.33);');
  lines.push('  --ss-border-strong-alpha: rgb(203 213 225 / 0.33);');

  lines.push('', '  /* Semantic typography */');
  for (const [name, role] of Object.entries(tokens.typography.roles)) {
    lines.push(`  --ss-type-${kebab(name)}-size: var(--ss-font-size-${kebab(role.size)});`);
    lines.push(`  --ss-type-${kebab(name)}-weight: var(--ss-font-weight-${kebab(role.weight)});`);
  }

  lines.push('', '  /* Component tokens */');
  lines.push('  --ss-header-bg: rgb(255 255 255 / 0.92);');
  lines.push('  --ss-nav-bg: rgb(255 255 255 / 0.96);');
  lines.push('  --ss-card-bg: var(--ss-surface);');
  lines.push('  --ss-card-border: var(--ss-border);');
  lines.push('  --ss-card-radius: var(--ss-radius-lg);');
  lines.push('  --ss-card-shadow: var(--ss-shadow-sm);');
  lines.push('  --ss-control-radius: var(--ss-radius-md);');
  lines.push(`  --ss-control-height: ${tokens.control.height};`);
  lines.push('}');

  lines.push('', 'html.dark {');
  for (const name of ['canvas', 'surface', 'surfaceSubtle', 'border', 'text', 'textSoft', 'textSubtle', 'textMuted', 'brandSoft', 'danger']) {
    lines.push(`  --ss-${kebab(name)}: var(--ss-dark-${kebab(name)});`);
  }
  lines.push('  --ss-header-bg: rgb(25 32 44 / 0.92);');
  lines.push('  --ss-nav-bg: rgb(25 32 44 / 0.96);');
  lines.push('}');

  return `${lines.join('\n')}\n`;
}

function generateTypeScript() {
  const colorEntries = Object.keys(semanticColors)
    .map((name) => `    ${name}: 'var(--ss-${kebab(name)})',`)
    .join('\n');
  const sizeEntries = Object.keys(tokens.typography.size)
    .map((name) => `    ${name}: 'var(--ss-font-size-${kebab(name)})',`)
    .join('\n');

  return `// AUTO-GENERATED from /starsnap-main/starsnap-web/design-system/tokens.json. Do not edit directly.\n` +
`export const designTokens = {\n` +
`  color: {\n${colorEntries}\n  },\n` +
`  typography: {\n` +
`    fontFamily: 'var(--ss-font-sans)',\n` +
`    size: {\n${sizeEntries}\n    },\n` +
`  },\n` +
`} as const;\n`;
}

function generateAndroidColors() {
  const semanticEntries = Object.entries(semanticColors)
    .map(([name, reference]) => `    val ${kotlinName(name)} = Color(${composeColor(resolveColor(reference))})`)
    .join('\n');
  const brandEntries = Object.entries(colorPrimitives.yellow)
    .map(([shade, value]) => `    val yellow${shade} = Color(${composeColor(value)})`)
    .join('\n');

  return `// AUTO-GENERATED from /starsnap-main/starsnap-web/design-system/tokens.json. Do not edit directly.\n` +
`package com.photo.starsnap.designsystem\n\n` +
`import androidx.compose.ui.graphics.Color\n\n` +
`object StarSnapColor {\n${semanticEntries}\n\n${brandEntries}\n}\n`;
}

function generateAndroidTypography() {
  const sizeEntries = Object.entries(tokens.typography.size)
    .map(([name, value]) => `    val ${name} = ${value.sp}.sp`)
    .join('\n');
  const roleEntries = Object.entries(tokens.typography.roles)
    .map(([name, role]) => `    val ${name} = TextStyle(\n` +
      `        fontFamily = TextFont.pretendard,\n` +
      `        fontWeight = FontWeight.${fontWeightName[role.weight]},\n` +
      `        fontSize = StarSnapFontSize.${role.size},\n` +
      `        lineHeight = ${role.lineHeightSp}.sp,\n` +
      `        color = StarSnapColor.text,\n` +
      `    )`)
    .join('\n\n');

  return `// AUTO-GENERATED from /starsnap-main/starsnap-web/design-system/tokens.json. Do not edit directly.\n` +
`package com.photo.starsnap.designsystem.text\n\n` +
`import androidx.compose.ui.text.TextStyle\n` +
`import androidx.compose.ui.text.font.FontWeight\n` +
`import androidx.compose.ui.unit.sp\n` +
`import com.photo.starsnap.designsystem.StarSnapColor\n\n` +
`object StarSnapFontSize {\n${sizeEntries}\n}\n\n` +
`object StarSnapTypography {\n${roleEntries}\n}\n`;
}

const css = generateCss();
const targets = new Map([
  ['starsnap-main/starsnap-web/src/styles/tokens.css', css],
  ['starsnap-admin/starsnap-admin-web/src/design-tokens.css', css],
  ['starsnap-hub/starsnap-hub-web/src/design-tokens.css', css],
  ['starsnap-main/starsnap-web/src/styles/designTokens.ts', generateTypeScript()],
  ['starsnap-main/starsnap-android/core/designsystem/src/main/java/com/photo/starsnap/designsystem/StarSnapColor.kt', generateAndroidColors()],
  ['starsnap-main/starsnap-android/core/designsystem/src/main/java/com/photo/starsnap/designsystem/text/StarSnapTypography.kt', generateAndroidTypography()],
]);

const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) {
  throw new Error('Use --check or --write.');
}

let hasMismatch = false;
for (const [relativePath, content] of targets) {
  const targetPath = path.join(workspaceRoot, relativePath);
  if (mode === '--write') {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log(`wrote ${relativePath}`);
    continue;
  }

  const current = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;
  if (current !== content) {
    hasMismatch = true;
    console.error(`out of sync: ${relativePath}`);
  } else {
    console.log(`ok: ${relativePath}`);
  }
}

if (hasMismatch) process.exitCode = 1;
