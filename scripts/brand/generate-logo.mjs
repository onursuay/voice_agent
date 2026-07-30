// DijiGrow brand asset generator (sharp + Montserrat).
// Concept A: ascending bars growth mark + "Diji"(SemiBold)+"Grow"(Bold) wordmark.
//
// Wordmark + glyph = solid BLACK on transparent → the app renders them via
// `brightness-0 invert` (dark surfaces → white) and a green `hue-rotate` (hero glyph).
// Favicon / app-icon = emerald mark on dark rounded surface → shown directly (no filter).
//
// Run: node scripts/brand/generate-logo.mjs   (from repo root; needs Montserrat in ~/Library/Fonts)
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FONTS = `${process.env.HOME}/Library/Fonts`;
const b64 = (f) => readFileSync(`${FONTS}/${f}`).toString('base64');
const faces = `
  @font-face{font-family:'M';font-weight:600;src:url(data:font/ttf;base64,${b64('Montserrat-SemiBold.ttf')}) format('truetype');}
  @font-face{font-family:'M';font-weight:700;src:url(data:font/ttf;base64,${b64('Montserrat-Bold.ttf')}) format('truetype');}`;

const EMERALD = '#10b981';

// 3 ascending bars inside an s×s box at (x,y) top-left.
const bars = (x, y, s, fill) => {
  const u = s / 16;
  return `<g fill="${fill}">
    <rect x="${x+u*1}"   y="${y+u*9}" width="${u*3.4}" height="${u*6}"  rx="${u}"/>
    <rect x="${x+u*6.3}" y="${y+u*5}" width="${u*3.4}" height="${u*10}" rx="${u}"/>
    <rect x="${x+u*11.6}" y="${y+u*1}" width="${u*3.4}" height="${u*14}" rx="${u}"/>
  </g>`;
};

const render = (svg, w, out) =>
  sharp(Buffer.from(svg)).resize({ width: w }).png().toFile(out).then(() => console.log('✓', out.replace(REPO + '/', '')));

mkdirSync(`${REPO}/public/logos`, { recursive: true });
mkdirSync(`${REPO}/src/app`, { recursive: true });

// 1) Wordmark (black, transparent) — mark + DijiGrow. viewBox 452×96.
const wordmark = (ink) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 452 96">
  <defs><style>${faces}</style></defs>
  ${bars(8, 16, 64, ink)}
  <text x="104" y="70" font-family="M" font-size="74" letter-spacing="-1.4" fill="${ink}"><tspan font-weight="600">Diji</tspan><tspan font-weight="700">Grow</tspan></text>
</svg>`;

// 2) Glyph mark only (black, transparent) — square.
const glyph = (ink) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${bars(8, 8, 48, ink)}</svg>`;

// 3) App icon — emerald bars on dark rounded square.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0c0c0f"/>
  ${bars(16, 16, 32, EMERALD)}
</svg>`;

await render(wordmark('#000000'), 1356, `${REPO}/public/logos/dijigrow-logo.png`); // primary (light-on-dark via invert)
await render(wordmark('#000000'), 904,  `${REPO}/public/dijigrow-logo.png`);       // root copy (footer/sidebar/sunum/apple-fallback)
await render(glyph('#000000'),    192,  `${REPO}/public/dijigrow-brain.png`);      // hero glyph (hue-rotate green)
await render(icon, 512, `${REPO}/src/app/icon.png`);        // Next app-router favicon (overrides .ico)
await render(icon, 180, `${REPO}/public/apple-icon.png`);   // apple-touch (square)
await render(icon, 32,  `${REPO}/public/favicon-32.png`);   // referenced in layout.tsx icons

console.log('done.');
