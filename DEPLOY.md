# Deploy Craftik in produzione (Render + Neon, gratis)

Questa guida ti porta da `git push` a un'app live su internet, **gratis**, in circa 15 minuti.

## L'architettura del deploy

Il free tier di Render nel 2026 ha una fregatura: i database Postgres gratuiti **vengono cancellati dopo 30 giorni**. Per un progetto reale la soluzione è tenere il codice su Render (che ha compute gratis permanente) e il database su un provider che offra Postgres gratis in modo permanente.

```
┌────────────────┐        ┌────────────────┐        ┌────────────────┐
│   Vercel/      │  HTTPS │   Render       │  SSL   │   Neon         │
│   Render web   │───────▶│   Web service  │───────▶│   Postgres     │
│   (frontend)   │        │   (backend)    │        │   (permanente) │
└────────────────┘        └────────────────┘        └────────────────┘
      gratis                gratis 750h/mo           gratis 0,5GB
```

**Trade-off del free tier:** entrambi i servizi Render si "addormentano" dopo 15 minuti di inattività. La prima richiesta dopo il sonno impiega 30–60 secondi a rispondere. Per un pilota/demo va benissimo. Per produzione reale con utenti serve almeno il piano Starter (€7/mese per servizio) che elimina il cold start.

---

## Prerequisiti

- Un account **GitHub** (o GitLab/Bitbucket) con questo repository pushato
- Un account **Render** — https://render.com (serve carta per verifica $1 rimborsato)
- Un account **Neon** — https://neon.tech (nessuna carta, Postgres gratis permanente)

---

## Passo 1: crea il database su Neon (2 minuti)

1. Vai su https://console.neon.tech e registrati con GitHub.
2. Crea un nuovo progetto: **Project name** `craftik`, **Postgres version** 16, **Region** `Europe (Frankfurt)` (o quella più vicina al backend).
3. Neon ti mostra subito la **Connection string** — copiala. Sarà simile a:
   ```
   postgresql://craftik_owner:XXXX@ep-late-fire-a1b2c3d4.eu-central-1.aws.neon.tech/craftik?sslmode=require
   ```
4. Tienila da parte, la userai al passo 2.

**Perché Neon?** Ha un free tier permanente con 0,5 GB di storage, connection pooling incluso, autoscaling, backup automatici. Per un MVP è più che sufficiente e non scade mai.

Alternative: **Supabase** (500 MB, si mette in pausa dopo 1 settimana di inattività ma si risveglia), **Railway** ($5 di credito/mese: ~1 mese di uso), **ElephantSQL Tiny Turtle** (20 MB, va bene solo per giocare).

---

## Passo 2: deploy con Render Blueprint (10 minuti)

Il file `render.yaml` alla radice del repository definisce entrambi i servizi. Render lo legge automaticamente.

### 2.1 Aggiorna il render.yaml con i tuoi URL

Apri `render.yaml` e sostituisci i due placeholder con i sottodomini che vuoi dare ai tuoi servizi (devono essere unici su tutto Render):

```yaml
      - key: CORS_ORIGINS
        value: https://TUO-craftik-web.onrender.com    # <— cambia
...
      - key: NEXT_PUBLIC_API_URL
        value: https://TUO-craftik-api.onrender.com/api/v1   # <— cambia
```

E cambia i nomi dei servizi in cima (le due `name:`) di conseguenza. Committa e pusha.

### 2.2 Crea il blueprint su Render

1. Su Render, clicca **New +** → **Blueprint**.
2. Collega il tuo GitHub e seleziona il repository `craftik-mvp`.
3. Render legge `render.yaml` e ti mostra i due servizi che sta per creare. Clicca **Apply**.
4. Ti chiederà i valori delle variabili con `sync: false` (che Render non può inventare):
   - **DATABASE_URL**: incolla la connection string di Neon copiata al passo 1.
5. Clicca **Deploy**.

Render inizia a buildare:
- **craftik-api**: builda il container Docker del backend, applica le migrazioni Alembic, carica il seed. ~4–6 min al primo build.
- **craftik-web**: builda l'immagine standalone Next.js con `NEXT_PUBLIC_API_URL` incorporato. ~3–5 min.

Quando entrambi sono verdi, la tua app è live all'URL del frontend.

### 2.3 Verifica

- Apri `https://TUO-craftik-api.onrender.com/api/v1/health` — dovrebbe rispondere `{"status":"ok"}`.
- Apri `https://TUO-craftik-api.onrender.com/docs` — Swagger interattivo.
- Apri `https://TUO-craftik-web.onrender.com` — la landing page.
- Login con le credenziali seed: `marco@craftik.dev` / `demo1234`.

Se qualcosa non va, guarda i **Logs** nella dashboard di Render — Alembic e uvicorn scrivono lì.

---

## Passo 3 (alternativa): Vercel per il frontend

Vercel è progettato per Next.js: cold start istantaneo, CDN globale, deploy in 30 secondi. Se lasci il backend su Render e sposti solo il frontend su Vercel elimini il cold start della UI (che è quello che l'utente vede).

1. Vai su https://vercel.com/new, importa il repo.
2. **Root directory**: `frontend`.
3. **Environment variables**: aggiungi `NEXT_PUBLIC_API_URL` = `https://TUO-craftik-api.onrender.com/api/v1`.
4. Clicca **Deploy**.
5. Dopo il deploy, torna sulla dashboard Render del backend e aggiorna `CORS_ORIGINS` con l'URL Vercel (es. `https://craftik.vercel.app`). Restart automatico.

Fatto: frontend istantaneo, backend che dorme solo la prima volta al giorno.

---

## Come gestire le migrazioni in produzione

Il backend applica automaticamente `alembic upgrade head` all'avvio grazie a `MIGRATE_ON_STARTUP=true`. Questo è comodo per l'MVP, ma quando avrai più repliche vorrai spostarlo in un job dedicato.

**Aggiungere una nuova migrazione**:

```bash
# In locale, con il backend spento:
cd backend
export DATABASE_URL="sqlite:///./dev.db"       # o il tuo DB di sviluppo
alembic revision --autogenerate -m "add contracts table"
# Rivedi il file generato in alembic/versions/, aggiusta se serve.
alembic upgrade head                            # applica in locale
git add alembic/versions/ && git commit && git push
```

Al prossimo deploy Render applicherà la migrazione automaticamente prima di far partire l'app.

**Rollback**: `alembic downgrade -1` (locale o in una console SSH — SSH disponibile solo su piani a pagamento).

---

## Passi successivi consigliati

Ora che sei in produzione, ecco le priorità per la settimana successiva.

### Auth più sicura (httpOnly cookies + middleware)

L'MVP usa `localStorage` per il token JWT, il che espone al furto via XSS. La strada per la produzione:

1. Il backend imposta il JWT come cookie `HttpOnly; Secure; SameSite=Lax` invece di rispondere in JSON.
2. Sul frontend, aggiungi `middleware.ts` alla radice di `src/app/` che legge il cookie e:
   - Redireziona a `/login` se manca su rotte protette.
   - Redireziona alla dashboard corretta se l'utente sbagliato prova a entrare nella dashboard dell'altro ruolo.

Vantaggi: SSR funziona (niente flash "Caricamento…"), niente token accessibile a JS, protezione più forte contro XSS.

### Type-safe API client dall'OpenAPI

Oggi i tipi TypeScript in `frontend/src/lib/types.ts` sono a mano — vanno tenuti in sync con i Pydantic del backend. La soluzione:

```bash
# In root:
npx openapi-typescript https://tua-api.onrender.com/openapi.json \
  --output frontend/src/lib/api.gen.ts
```

Poi usi `paths` e `components` importati da lì. Un cambio di schema backend rompe il typecheck del frontend prima ancora del deploy.

### Cron di keep-alive (se il cold-start ti dà fastidio)

Un semplice cron esterno (UptimeRobot gratis, o Render Cron Job free tier) che chiama `/api/v1/health` ogni 10 minuti tiene il backend sempre caldo. Costo: rientra nelle 750 ore/mese di Render.

Attenzione: se usi il keep-alive **e** il frontend, esaurisci le 750 ore in circa 15 giorni (2 servizi × 24h × 15gg = 720h). Per stare tranquillo con il free tier, tieni caldo solo il backend e lascia dormire il frontend (o meglio, sposta il frontend su Vercel come descritto sopra).

### Custom domain

Sul piano free di Render puoi collegare un dominio custom gratuitamente. Impostazioni servizio → **Custom Domains** → segui le istruzioni DNS. HTTPS automatico via Let's Encrypt.

---

## Costi realistici quando cresci

| Scenario | Frontend | Backend | Database | Totale/mese |
|---|---|---|---|---|
| **Solo demo/pilota** | Vercel free | Render free | Neon free | **€0** |
| **Utenti reali, no cold start** | Vercel free | Render Starter $7 | Neon free (0,5 GB) | **~€7** |
| **50k utenti/mese** | Vercel Pro $20 | Render Standard $25 | Neon Launch $19 | **~€64** |
| **500k utenti/mese** | Vercel Pro $20 | 2× Render Pro $85 | Neon Scale $69 | **~€260** |

I costi scalano linearmente con l'uso — nessuna sorpresa da migliaia di euro come su hosting basati su cold-start pricing.

---

## Troubleshooting

**"Application failed to start"** → controlla i Logs. Cause tipiche:
- `DATABASE_URL` non impostata o formato sbagliato. Neon la fornisce con `?sslmode=require` — includilo.
- Prima esecuzione delle migrazioni: se hai già dati e Alembic non trova la revisione baseline, `alembic stamp head` una volta risolve.

**CORS error nel browser** → il frontend chiama il backend da un dominio non elencato in `CORS_ORIGINS`. Vai nelle env vars del backend su Render e aggiungilo (separando con virgole se ne hai più di uno).

**"Free instance hours exhausted"** → hai usato 750 ore. Il servizio si sospende fino al 1° del mese successivo. Soluzione: passa a Starter ($7/mese) uno dei due servizi, oppure sposta il frontend su Vercel.

**Postgres Neon lento a "svegliarsi"** → il free tier di Neon mette in scale-to-zero le connessioni. La prima query dopo 5 minuti di inattività può impiegare 300-500 ms. Il pool interno di SQLAlchemy lo gestisce.

**Il frontend build fallisce con "NEXT_PUBLIC_API_URL undefined"** → assicurati che sia in `envVars` del servizio frontend, non del backend. In Next le variabili `NEXT_PUBLIC_*` sono incorporate al momento del build, non del runtime.

---

## In sintesi

- **Codice**: pushato su GitHub, `render.yaml` letto in automatico.
- **DB**: Neon (gratis permanente, 0,5 GB).
- **API**: Render web service free (750h/mese, cold start dopo 15 min).
- **Frontend**: Render free o meglio Vercel (istantaneo).
- **Migrazioni**: Alembic applicate all'avvio con `MIGRATE_ON_STARTUP=true`.
- **Sicurezza**: `SECRET_KEY` generata da Render, HTTPS out of the box.

Total setup: 15 minuti. Costo: 0 €. Perfetto per il pilota, per le prime interviste con utenti, per un'e-mail agli angel con "eccolo, provalo".

---

## Aggiornare la produzione alla v0.2 (portfolio, chat, certificazioni, 50 profili)

La v0.2 aggiunge 3 tabelle (migrazione `0002`) e un seed con 35 professionisti + 15 aziende.

1. **Push del nuovo codice** su GitHub → Render builda e applica `alembic upgrade head` in automatico (le nuove tabelle vengono create senza toccare i dati esistenti).
2. **Per caricare i 50 profili demo** il database deve essere vuoto (il seed non sovrascrive dati esistenti). Se vuoi ripartire dal seed nuovo: nella console SQL di Neon esegui

   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

   poi su Render fai **Manual Deploy → Clear build cache & deploy**. All'avvio: migrazioni → seed dei 50 profili.
3. Se invece hai già dati veri da preservare: salta il punto 2 — le nuove funzionalità sono disponibili da subito, semplicemente senza dati demo aggiuntivi.

Login demo invariati: `marco@craftik.dev` / `demo1234`, `hr@edilcostruzioni.dev` / `demo1234` (tutti gli account seed usano `demo1234`).
