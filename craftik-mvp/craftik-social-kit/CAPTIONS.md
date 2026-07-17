# Craftik — Social Kit: caption e script

## Contenuto del kit

| File | Formato | Uso |
|---|---|---|
| `carousel-01…07.png` | 1080×1350 (4:5) | Carosello Instagram / TikTok photo mode / LinkedIn |
| `story-cover.png` | 1080×1920 (9:16) | Storia IG, copertina Reel/TikTok |

Sistema grafico comune a tutte le slide: blu notte + arancione sicurezza, griglia blueprint, sigillo esagonale di verifica, barra "hazard" a strisce (nastro da cantiere) come sottolineatura, numerazione e dots di avanzamento, handle nel footer.

---

## Caption Instagram (carosello)

> Il tuo CV non dice chi sei. I tuoi cantieri sì. 🧱
>
> Craftik trasforma ogni lavoro completato in reputazione verificata:
> 1️⃣ Profilo in 5 minuti — fotografi i patentini, li legge l'AI
> 2️⃣ Score da 0 a 100 — trasparente, sai come migliorarlo
> 3️⃣ Le offerte ti trovano — match per competenze e distanza
> 4️⃣ Recensioni solo da aziende con cui hai lavorato davvero
>
> Sei un elettricista, idraulico, muratore, gruista, saldatore? La tua esperienza vale. Dimostralo.
>
> 👉 Provala gratis — link in bio
>
> #edilizia #cantiere #elettricista #idraulico #muratore #artigiani #lavoro #impiantista #costruzioni #operaio #saldatore #gruista #lavoroedile #craftik

**Consigli di pubblicazione**: orario 6:30–7:30 o 17:30–19:00 (pause cantiere). Prima slide = hook, non metterci il logo grande. Tagga città nei post localizzati ("Cercasi elettricisti a Bergamo").

---

## Script TikTok / Reel (30 secondi)

**Formato**: parlato in camera o voiceover su screen-recording dell'app. Sottotitoli sempre attivi (la maggioranza guarda senza audio).

| Tempo | Scena | Voiceover | Testo a schermo |
|---|---|---|---|
| 0–3s | Primo piano, mani sporche di lavoro / cantiere reale | "Fai questo mestiere da 15 anni. E non puoi dimostrarlo." | **15 ANNI DI ESPERIENZA. ZERO PROVE.** |
| 3–7s | Screen-recording: onboarding Craftik, selezione professione | "Su Craftik il profilo si fa in 5 minuti, dal telefono." | Profilo in 5 min ⏱ |
| 7–12s | Zoom sulla foto del patentino → spunta verde | "Fotografi il patentino. Lo legge l'AI. Verificato." | ⬢ PATENTINO VERIFICATO |
| 12–17s | Score ring che si anima da 0 a 87 | "Ogni lavoro completato alza il tuo score. Da 0 a 100." | SCORE 87/100 |
| 17–23s | Mappa con raggio + card offerta "Match 94%" | "E le offerte ti trovano. Vicino a casa, o in trasferta." | Match 94% · 8 km · €38/h |
| 23–28s | Recensione 5 stelle che appare + "azienda verificata" | "Le recensioni? Solo da aziende con cui hai lavorato davvero." | ZERO RECENSIONI FAKE |
| 28–30s | Logo Craftik su fondo arancione (usa slide 7) | "Craftik. I tuoi cantieri parlano per te." | Link in bio 👉 |

**Hook alternativi da testare (A/B)**:
- "Le agenzie si prendono il 30% del tuo lavoro. Ecco l'alternativa."
- "POV: sei il miglior elettricista della zona ma nessuno può saperlo."
- "Il passaparola ti ha dato lavoro per 20 anni. E quando finisce?"

**Versione azienda (secondo video)**:
- Hook: "Ti serve un carpentiere per lunedì e l'agenzia ti chiede il 35%?"
- Flow: ricerca con filtri → profili con score → contatto → ingaggio.
- CTA: "Trova professionisti verificati nella tua zona. Gratis."

---

## Come rigenerare o modificare le grafiche

Il kit è generato da codice (`kit.js` + `slides.js`, Node + sharp). Per cambiare testi, colori o aggiungere slide:

```bash
cd social
npm install sharp
node slides.js   # rigenera tutto in out/
```

Ogni slide è una funzione SVG: testi e layout si modificano direttamente nel file. Il design system (colori, header, footer, hazard bar) è centralizzato in `kit.js` — cambi lì, cambia ovunque.
