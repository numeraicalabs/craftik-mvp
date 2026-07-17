// The 7 carousel slides + 1 story cover.
const K = require("./kit.js");
const { W, H, C, DISPLAY, BODY, hexSeal, header, eyebrow, footer, title, bodyText, ring, chip, bg, wrap, sharp } = K;
const TOT = 7;

const slides = [];

/* ============ SLIDE 1 — HOOK ============ */
slides.push(wrap(`
${bg(true, [[760, -120, 560], [-160, 950, 480]])}
${header(true, 1, TOT)}
${eyebrow("Edilizia · Impianti · Artigiani", 320, true)}
${title(["Il tuo CV", "non dice", "chi sei."], 470, 128, true)}
${title(["I tuoi cantieri sì."], 940, 96, true, [0])}
${bodyText(["Come funziona l'app che trasforma", "ogni lavoro in reputazione — in 4 step."], 1060, 40, C.slateL)}
${footer(true, 1, TOT)}
`));

/* ============ SLIDE 2 — IL PROBLEMA ============ */
function problemRow(y, text1, text2) {
  return `
  <rect x="80" y="${y}" width="920" height="150" rx="24" fill="${C.concrete}"/>
  <circle cx="160" cy="${y + 75}" r="38" fill="#FDE8E8"/>
  <path d="M${160 - 16} ${y + 75 - 16} l32 32 m0 -32 l-32 32" stroke="#D64545" stroke-width="8" stroke-linecap="round"/>
  <text x="232" y="${y + 66}" font-family="${BODY}" font-weight="700" font-size="36" fill="${C.night}">${text1}</text>
  <text x="232" y="${y + 112}" font-family="${BODY}" font-weight="500" font-size="30" fill="${C.muted}">${text2}</text>`;
}
slides.push(wrap(`
${bg(false, [[820, 1020, 420]])}
${header(false, 2, TOT)}
${eyebrow("Il problema", 300, false)}
${title(["Trovare lavoro va", "ancora a passaparola."], 430, 76, false)}
${problemRow(620, "Le esperienze non si possono dimostrare", "Il curriculum racconta, ma nessuno verifica.")}
${problemRow(800, "Le recensioni non sono affidabili", "Chiunque può scriverle. Anche chi non ti conosce.")}
${problemRow(980, "Le agenzie trattengono fino al 30-40%", "E i pagamenti arrivano a 60-90 giorni.")}
${footer(false, 2, TOT)}
`));

/* ============ SLIDE 3 — STEP 1: PROFILO (phone mockup) ============ */
const phoneX = 300, phoneY = 560, phoneW = 480, phoneH = 620;
slides.push(wrap(`
${bg(true, [[700, 150, 500]])}
${header(true, 3, TOT)}
${eyebrow("Step 1", 300, true)}
${title(["Crea il profilo", "in 5 minuti."], 420, 84, true)}

<!-- phone -->
<rect x="${phoneX - 14}" y="${phoneY - 14}" width="${phoneW + 28}" height="${phoneH + 28}" rx="56" fill="${C.night2}"/>
<rect x="${phoneX}" y="${phoneY}" width="${phoneW}" height="${phoneH}" rx="44" fill="${C.concrete}"/>
<!-- screen: mini profile -->
<rect x="${phoneX}" y="${phoneY}" width="${phoneW}" height="190" rx="44" fill="${C.night}"/>
<rect x="${phoneX}" y="${phoneY + 100}" width="${phoneW}" height="90" fill="${C.night}"/>
<circle cx="${phoneX + 90}" cy="${phoneY + 95}" r="52" fill="url(#avatarGrad)"/>
<text x="${phoneX + 90}" y="${phoneY + 112}" text-anchor="middle" font-family="${DISPLAY}" font-size="42" fill="#FFFFFF">MB</text>
<text x="${phoneX + 165}" y="${phoneY + 82}" font-family="${BODY}" font-weight="700" font-size="34" fill="#FFFFFF">Marco Bianchi</text>
<text x="${phoneX + 165}" y="${phoneY + 126}" font-family="${BODY}" font-weight="500" font-size="27" fill="${C.slate}">Elettricista · Bergamo</text>
${chip(phoneX + 34, phoneY + 226, 240, 58, "⚡ Elettricista", "#FFEDE0", C.orangeD)}
${chip(phoneX + 288, phoneY + 226, 160, 58, "12 anni", "#E7EFF8", C.night)}
<rect x="${phoneX + 34}" y="${phoneY + 320}" width="${phoneW - 68}" height="100" rx="20" fill="#FFFFFF"/>
${hexSeal(phoneX + 56, phoneY + 344, 52, C.green)}
<text x="${phoneX + 126}" y="${phoneY + 362}" font-family="${BODY}" font-weight="700" font-size="28" fill="${C.night}">Patentino PLE</text>
<text x="${phoneX + 126}" y="${phoneY + 398}" font-family="${BODY}" font-weight="600" font-size="24" fill="${C.green}">Verificato</text>
<rect x="${phoneX + 34}" y="${phoneY + 440}" width="${phoneW - 68}" height="100" rx="20" fill="#FFFFFF"/>
${hexSeal(phoneX + 56, phoneY + 464, 52, C.green)}
<text x="${phoneX + 126}" y="${phoneY + 482}" font-family="${BODY}" font-weight="700" font-size="28" fill="${C.night}">Identità (KYC)</text>
<text x="${phoneX + 126}" y="${phoneY + 518}" font-family="${BODY}" font-weight="600" font-size="24" fill="${C.green}">Verificata</text>

<!-- floating callouts -->
<rect x="120" y="${phoneY + 60}" width="150" height="150" rx="26" fill="#FFFFFF"/>
<text x="195" y="${phoneY + 128}" text-anchor="middle" font-family="${DISPLAY}" font-size="48" fill="${C.orange}">5</text>
<text x="195" y="${phoneY + 168}" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="26" fill="${C.night}">minuti</text>
<rect x="790" y="${phoneY + 330}" width="200" height="110" rx="26" fill="#FFFFFF"/>
<text x="890" y="${phoneY + 378}" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="28" fill="${C.night}">Foto del</text>
<text x="890" y="${phoneY + 412}" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="28" fill="${C.orangeD}">patentino →</text>

${bodyText(["Patentini fotografati, letti e verificati dall'AI."], 1235, 37, C.slateL)}
${footer(true, 3, TOT)}
`));

/* ============ SLIDE 4 — STEP 2: SCORE ============ */
function scoreBar(y, label, val) {
  const bw = 520;
  return `
  <text x="420" y="${y}" font-family="${BODY}" font-weight="600" font-size="32" fill="${C.ink}">${label}</text>
  <text x="${420 + bw}" y="${y}" text-anchor="end" font-family="${BODY}" font-weight="700" font-size="32" fill="${C.night}">${val}</text>
  <rect x="420" y="${y + 16}" width="${bw}" height="16" rx="8" fill="${C.concrete}"/>
  <rect x="420" y="${y + 16}" width="${(bw * val) / 100}" height="16" rx="8" fill="${C.orange}"/>`;
}
slides.push(wrap(`
${bg(false, [[800, -80, 420]])}
${header(false, 4, TOT)}
${eyebrow("Step 2", 300, false)}
${title(["L'AI ti dà uno score", "da 0 a 100."], 420, 76, false)}
${ring(220, 810, 130, 87, 30, false, 100)}
<text x="220" y="1000" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="30" fill="${C.muted}">Score Craftik</text>
${scoreBar(680, "Lavori verificati", 92)}
${scoreBar(780, "Puntualità e affidabilità", 88)}
${scoreBar(880, "Recensioni certificate", 90)}
${scoreBar(980, "Certificazioni", 76)}
<rect x="80" y="1080" width="920" height="110" rx="24" fill="#FFF6D6"/>
<text x="120" y="1128" font-family="${BODY}" font-weight="700" font-size="32" fill="#6B5400">Trasparente: vedi ogni componente</text>
<text x="120" y="1168" font-family="${BODY}" font-weight="500" font-size="30" fill="#8A6D00">e sai esattamente come migliorarlo.</text>
${footer(false, 4, TOT)}
`));

/* ============ SLIDE 5 — STEP 3: OFFERTE / MAPPA ============ */
function pin(x, y, label) {
  return `
  <rect x="${x - 52}" y="${y - 76}" width="104" height="56" rx="16" fill="${C.orange}"/>
  <text x="${x}" y="${y - 38}" text-anchor="middle" font-family="${DISPLAY}" font-size="30" fill="#FFFFFF">${label}</text>
  <path d="M${x - 10} ${y - 20} h20 l-10 16 z" fill="${C.orange}"/>`;
}
const mapX = 80, mapY = 560, mapW = 920, mapH = 540;
slides.push(wrap(`
${bg(true, [[-120, 200, 420]])}
${header(true, 5, TOT)}
${eyebrow("Step 3", 300, true)}
${title(["Le offerte", "ti trovano."], 420, 84, true)}

<!-- map panel -->
<rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" rx="36" fill="${C.night2}"/>
<clipPath id="mapClip"><rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" rx="36"/></clipPath>
<g clip-path="url(#mapClip)">
  <rect x="${mapX}" y="${mapY}" width="${mapW}" height="${mapH}" fill="url(#gridDark)"/>
  <circle cx="${mapX + 460}" cy="${mapY + 300}" r="200" fill="none" stroke="${C.signal}" stroke-width="4" stroke-dasharray="16 14" opacity="0.8"/>
  <circle cx="${mapX + 460}" cy="${mapY + 300}" r="16" fill="${C.signal}"/>
  <text x="${mapX + 460}" y="${mapY + 356}" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="28" fill="${C.signal}">TU</text>
  ${pin(mapX + 300, mapY + 200, "87")}
  ${pin(mapX + 640, mapY + 170, "93")}
  ${pin(mapX + 620, mapY + 430, "91")}
</g>
<!-- job card overlay -->
<rect x="${mapX + 40}" y="${mapY + 320}" width="430" height="180" rx="26" fill="#FFFFFF"/>
<text x="${mapX + 74}" y="${mapY + 378}" font-family="${BODY}" font-weight="700" font-size="32" fill="${C.night}">Cabina MT/BT</text>
<text x="${mapX + 74}" y="${mapY + 418}" font-family="${BODY}" font-weight="500" font-size="28" fill="${C.muted}">8 km · €38/h · 6 settimane</text>
${chip(mapX + 74, mapY + 438, 190, 48, "Match 94%", "#E4F8EC", "#128A3E", 26)}
${chip(mapX + 278, mapY + 438, 160, 48, "Urgente", "#FFEDE0", C.orangeD, 26)}

${bodyText(["Match per competenze e distanza. Candidatura in 1 tap."], 1220, 36, C.slateL)}
${footer(true, 5, TOT)}
`));

/* ============ SLIDE 6 — STEP 4: RECENSIONE CERTIFICATA ============ */
function flowNode(x, y, w, label1, label2, iconFill, done) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="170" rx="26" fill="${C.concrete}"/>
  <circle cx="${x + w / 2}" cy="${y + 56}" r="34" fill="${iconFill}"/>
  ${done ? `<path d="M${x + w / 2 - 15} ${y + 56} l10 11 20 -22" stroke="#FFFFFF" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
  <text x="${x + w / 2}" y="${y + 122}" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="28" fill="${C.night}">${label1}</text>
  <text x="${x + w / 2}" y="${y + 154}" text-anchor="middle" font-family="${BODY}" font-weight="500" font-size="25" fill="${C.muted}">${label2}</text>`;
}
slides.push(wrap(`
${bg(false, [[840, 180, 380]])}
${header(false, 6, TOT)}
${eyebrow("Step 4", 300, false)}
${title(["Lavori. Recensione", "certificata. Score su."], 420, 72, false)}
${flowNode(80, 620, 280, "Lavoro", "completato", C.night, true)}
<path d="M372 705 h56 m-16 -13 l17 13 -17 13" stroke="${C.orange}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
${flowNode(440, 620, 280, "Recensione", "dall'azienda", C.orange, true)}
<path d="M732 705 h56 m-16 -13 l17 13 -17 13" stroke="${C.orange}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
${flowNode(800, 620, 200, "Score", "aumenta", C.green, true)}

<!-- stars card -->
<rect x="80" y="860" width="920" height="200" rx="30" fill="${C.night}"/>
<text x="128" y="932" font-family="${BODY}" font-weight="700" font-size="34" fill="#FFFFFF">"Lavoro impeccabile, consegnato in anticipo."</text>
<g transform="translate(128, 960)">
  ${[0, 1, 2, 3, 4].map((i) => `<path transform="translate(${i * 56},0) scale(1.9)" d="M12 2l2.9 6.2 6.6.8-4.9 4.6 1.3 6.5L12 16.9 6.1 20.1l1.3-6.5L2.5 9l6.6-.8z" fill="${C.signal}"/>`).join("")}
</g>
<text x="470" y="998" font-family="${BODY}" font-weight="600" font-size="28" fill="${C.slate}">Edilcostruzioni SpA · verificata</text>

<rect x="80" y="1100" width="920" height="100" rx="24" fill="#E4F8EC"/>
${hexSeal(112, 1122, 56, C.green)}
<text x="196" y="1160" font-family="${BODY}" font-weight="700" font-size="31" fill="#128A3E">Solo aziende con cui hai lavorato davvero. Zero fake.</text>
${footer(false, 6, TOT)}
`));

/* ============ SLIDE 7 — CTA ============ */
slides.push(wrap(`
<rect width="${W}" height="${H}" fill="url(#ctaGrad)"/>
<rect width="${W}" height="${H}" fill="url(#gridDark)"/>
${K.hexOutline(700, -140, 620, "#FFFFFF", 0.25)}
${K.hexOutline(-180, 900, 520, "#FFFFFF", 0.2)}
${hexSeal(80, 90, 88, "#FFFFFF", C.orange)}
<text x="192" y="156" font-family="${DISPLAY}" font-size="60" fill="#FFFFFF">craftik</text>
${title(["Where skills", "become", "opportunities."], 480, 110, true)}
<text x="80" y="880" font-family="${BODY}" font-weight="600" font-size="42" fill="#FFF3EA">Ogni cantiere completato</text>
<text x="80" y="936" font-family="${BODY}" font-weight="600" font-size="42" fill="#FFF3EA">diventa la tua reputazione.</text>
<rect x="80" y="1030" width="560" height="110" rx="55" fill="#FFFFFF"/>
<text x="360" y="1100" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="40" fill="${C.orangeD}">Provala gratis → link in bio</text>
<text x="80" y="${H - 64}" font-family="${BODY}" font-weight="700" font-size="30" fill="#FFE0CC">@craftik.app · craftik.eu</text>
`));

/* ============ STORY / TIKTOK COVER 1080x1920 ============ */
const SW = 1080, SH = 1920;
const story = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">${K.defs}
<rect width="${SW}" height="${SH}" fill="${C.night}"/>
<rect width="${SW}" height="${SH}" fill="url(#gridDark)"/>
${K.hexOutline(720, 60, 560, "#FFFFFF", 0.1)}
${K.hexOutline(-160, 1450, 520, "#FFFFFF", 0.1)}
${hexSeal(80, 120, 76)}
<text x="178" y="176" font-family="${DISPLAY}" font-size="52" fill="#FFFFFF">craftik</text>
<text x="80" y="480" font-family="${BODY}" font-weight="700" font-size="38" letter-spacing="6" fill="${C.signal}">EDILIZIA · IMPIANTI · ARTIGIANI</text>
<rect x="80" y="506" width="170" height="16" rx="4" fill="url(#hazard)"/>
<text x="80" y="700" font-family="${DISPLAY}" font-size="150" fill="#FFFFFF">Il tuo CV</text>
<text x="80" y="868" font-family="${DISPLAY}" font-size="150" fill="#FFFFFF">non dice</text>
<text x="80" y="1036" font-family="${DISPLAY}" font-size="150" fill="#FFFFFF">chi sei.</text>
<text x="80" y="1240" font-family="${DISPLAY}" font-size="110" fill="${C.orange}">I tuoi cantieri sì.</text>
${ring(540, 1520, 120, 87, 28, true, 92)}
<text x="540" y="1700" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="34" fill="${C.slate}">Il tuo Score professionale, verificato</text>
<text x="540" y="${SH - 90}" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="36" fill="#FFFFFF">@craftik.app</text>
</svg>`;

/* ============ render ============ */
(async () => {
  const outDir = "/home/claude/social/out";
  K.fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < slides.length; i++) {
    await sharp(Buffer.from(slides[i])).png().toFile(`${outDir}/carousel-0${i + 1}.png`);
    console.log(`carousel-0${i + 1}.png done`);
  }
  await sharp(Buffer.from(story)).png().toFile(`${outDir}/story-cover.png`);
  console.log("story-cover.png done");
})().catch((e) => { console.error(e); process.exit(1); });
