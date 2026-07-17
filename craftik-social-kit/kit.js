// Craftik social kit generator — IG carousel (1080x1350) + story (1080x1920)
// Shared graphic system: night/white alternating, blueprint grid, hex seal,
// hazard-stripe underline (the kit's signature), Archivo Black + Inter.
const sharp = require("sharp");
const fs = require("fs");

const W = 1080, H = 1350;
const C = {
  night: "#0F2A43", night2: "#16395C", night3: "#2A4664",
  orange: "#FF6B1A", orangeD: "#E5560A", orangeL: "#FF9A5C",
  signal: "#FFC400", green: "#1DB954", greenL: "#5CE690",
  concrete: "#F4F5F7", ink: "#1B2733", muted: "#5C6B7A",
  line: "#E3E7EC", slate: "#8FA2B5", slateL: "#B9C6D4",
};
const DISPLAY = "Archivo Black";
const BODY = "Inter";

// ---------- shared pieces ----------
const defs = `
<defs>
  <pattern id="gridDark" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M60 0H0V60" fill="none" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1.5"/>
  </pattern>
  <pattern id="gridLight" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M60 0H0V60" fill="none" stroke="#0F2A43" stroke-opacity="0.05" stroke-width="1.5"/>
  </pattern>
  <pattern id="hazard" width="28" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
    <rect width="28" height="14" fill="${C.orange}"/>
    <path d="M-7 14 L7 0 M7 14 L21 0 M21 14 L35 0" stroke="${C.night}" stroke-width="7"/>
  </pattern>
  <linearGradient id="ctaGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.orange}"/>
    <stop offset="1" stop-color="${C.orangeL}"/>
  </linearGradient>
  <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${C.orange}"/>
    <stop offset="1" stop-color="${C.orangeL}"/>
  </linearGradient>
</defs>`;

function hexSeal(x, y, size, fill = C.orange, check = "#FFFFFF") {
  const s = size / 40;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="${fill}"/>
    <path d="M13 20.5l5 5 9-11" stroke="${check}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function hexOutline(x, y, size, stroke, opacity) {
  const s = size / 40;
  return `<g transform="translate(${x},${y}) scale(${s})" opacity="${opacity}">
    <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="${stroke}" stroke-width="0.8"/>
  </g>`;
}

// Header: seal + wordmark left, slide index right
function header(dark, idx, total) {
  const fg = dark ? "#FFFFFF" : C.night;
  const sub = dark ? C.slate : C.muted;
  return `
  ${hexSeal(80, 74, 64)}
  <text x="162" y="122" font-family="${DISPLAY}" font-size="44" fill="${fg}">craftik</text>
  <text x="${W - 80}" y="118" text-anchor="end" font-family="${BODY}" font-weight="700" font-size="30" fill="${sub}">${String(idx).padStart(2, "0")} / ${String(total).padStart(2, "0")}</text>`;
}

// Signature: eyebrow with hazard-stripe underline
function eyebrow(text, y, dark) {
  const fg = dark ? C.signal : C.orangeD;
  return `
  <text x="80" y="${y}" font-family="${BODY}" font-weight="700" font-size="34" letter-spacing="6" fill="${fg}">${text.toUpperCase()}</text>
  <rect x="80" y="${y + 22}" width="150" height="14" rx="3" fill="url(#hazard)"/>`;
}

// Footer: progress dots + handle + swipe arrow
function footer(dark, idx, total, last = false) {
  const sub = dark ? C.slate : C.muted;
  let dots = "";
  const dotsW = total * 30;
  const x0 = 80;
  for (let i = 1; i <= total; i++) {
    const on = i === idx;
    dots += `<circle cx="${x0 + (i - 1) * 30 + 7}" cy="${H - 76}" r="${on ? 9 : 6}" fill="${on ? C.orange : dark ? C.night3 : C.line}"/>`;
  }
  const right = last
    ? `<text x="${W - 80}" y="${H - 64}" text-anchor="end" font-family="${BODY}" font-weight="700" font-size="30" fill="${sub}">@craftik.app</text>`
    : `<text x="${W - 80}" y="${H - 64}" text-anchor="end" font-family="${BODY}" font-weight="700" font-size="30" fill="${sub}">@craftik.app · scorri</text>
       <path d="M${W - 500} ${H - 74} h36 m-12 -11 l13 11 -13 11" stroke="${C.orange}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return dots + right;
}

// Big display title with manual lines; accentIdx lines are orange
function title(lines, y, size, dark, accent = []) {
  const fg = dark ? "#FFFFFF" : C.night;
  return lines
    .map((l, i) => `<text x="80" y="${y + i * (size * 1.12)}" font-family="${DISPLAY}" font-size="${size}" fill="${accent.includes(i) ? C.orange : fg}">${l}</text>`)
    .join("");
}

function bodyText(lines, y, size, color, x = 80, weight = 500, lh = 1.45) {
  return lines
    .map((l, i) => `<text x="${x}" y="${y + i * size * lh}" font-family="${BODY}" font-weight="${weight}" font-size="${size}" fill="${color}">${l}</text>`)
    .join("");
}

// Score ring
function ring(cx, cy, r, val, stroke, dark, numSize) {
  const cir = 2 * Math.PI * r;
  const off = cir * (1 - val / 100);
  const track = dark ? "#FFFFFF22" : C.line;
  const txt = dark ? "#FFFFFF" : C.night;
  return `
  <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${track}" stroke-width="${stroke}" fill="none"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${C.orange}" stroke-width="${stroke}" fill="none"
    stroke-linecap="round" stroke-dasharray="${cir}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy + numSize * 0.36}" text-anchor="middle" font-family="${DISPLAY}" font-size="${numSize}" fill="${txt}">${val}</text>`;
}

function chip(x, y, w, h, text, bg, fg, fontSize = 26) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}"/>
  <text x="${x + w / 2}" y="${y + h / 2 + fontSize * 0.36}" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="${fontSize}" fill="${fg}">${text}</text>`;
}

function bg(dark, decoHexes = []) {
  const base = `<rect width="${W}" height="${H}" fill="${dark ? C.night : "#FFFFFF"}"/>
  <rect width="${W}" height="${H}" fill="url(#${dark ? "gridDark" : "gridLight"})"/>`;
  const hexes = decoHexes
    .map(([x, y, s]) => hexOutline(x, y, s, dark ? "#FFFFFF" : C.night, dark ? 0.10 : 0.06))
    .join("");
  return base + hexes;
}

function wrap(children) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${children}</svg>`;
}

module.exports = { W, H, C, DISPLAY, BODY, defs, hexSeal, hexOutline, header, eyebrow, footer, title, bodyText, ring, chip, bg, wrap, sharp, fs };
