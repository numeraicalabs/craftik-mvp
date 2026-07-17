# Craftik — MVP

**Where skills become opportunities.**

Piattaforma europea per il lavoro specializzato in edilizia, costruzioni, manutenzione, impiantistica e artigianato. Questo repository contiene l'MVP deployable: backend FastAPI modulare, frontend Next.js, database PostgreSQL — tutto in Docker Compose.

---

## Cosa contiene l'MVP

- **Autenticazione JWT** — registrazione e login per lavoratori e aziende
- **Profili lavoratori verificati** — professioni, esperienza, tariffa, geolocalizzazione, raggio di trasferta
- **Profili aziende** — con P.IVA
- **Offerte di lavoro** — permanenti, temporanee, freelance; con requisiti di professione, tariffa, urgenza
- **Ricerca geolocalizzata** — filtro per professione, distanza (Haversine), score minimo
- **Candidature** — con match score automatico
- **Score reputazionale AI (v0, spiegabile)** — calcolato su recensioni, lavori completati, completezza profilo, verifica
- **Recensioni certificate** — solo tra parti che hanno completato un ingaggio
- **Seed di dati demo** — 8 lavoratori, 3 aziende, 5 offerte, recensioni
- **Landing page interattiva** — clone della demo dal mockup
- **Documentazione API automatica** — Swagger su `/docs`

## Cosa NON contiene (roadmap post-MVP)

Pagamenti/escrow Stripe, firma digitale eIDAS, contratti PDF, chat realtime, feed social, matching AI avanzato con embedding, KYC provider integrato, notifiche push, app native. La struttura del codice è già predisposta per aggiungerli come nuovi moduli.

## Deploy in produzione (gratis)

Vedi **[DEPLOY.md](./DEPLOY.md)** per la guida step-by-step: Render (backend + frontend) + Neon (Postgres permanente gratis). Setup in ~15 minuti, `render.yaml` incluso per un blueprint one-click.

---

## Avvio in 30 secondi

**Requisiti:** Docker Desktop.

```bash
git clone <this-repo>
cd craftik-mvp
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- API + Swagger: http://localhost:8000/docs
- Postgres: `localhost:5432` (user `craftik`, password `craftik`, db `craftik`)

Al primo avvio le tabelle vengono create e i dati demo caricati automaticamente.

### Credenziali di test (seed)

| Ruolo | Email | Password |
|---|---|---|
| Lavoratore | `marco@craftik.dev` | `demo1234` |
| Lavoratore | `sara@craftik.dev` | `demo1234` |
| Azienda | `hr@edilcostruzioni.dev` | `demo1234` |
| Azienda | `hr@gruppocasa.dev` | `demo1234` |

---

## Architettura

```
craftik-mvp/
├── backend/                    # FastAPI modular monolith
│   ├── app/
│   │   ├── main.py            # entrypoint, CORS, router mount, startup
│   │   ├── core/              # config, security, dependencies
│   │   ├── db/                # engine, session, base
│   │   ├── models/            # SQLAlchemy ORM (one file per aggregate)
│   │   ├── schemas/           # Pydantic (request/response DTOs)
│   │   ├── services/          # domain logic (scoring, matching, geo)
│   │   ├── api/               # routers grouped by domain
│   │   └── seed.py            # demo data loader
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                  # Next.js 14 App Router + TS + Tailwind
│   ├── src/
│   │   ├── app/               # routes (landing, login, register, dashboards)
│   │   ├── components/
│   │   ├── lib/               # API client, auth store
│   │   └── styles/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### Perché monolite modulare

Un modulo = un aggregato di dominio (workers, companies, jobs...). Ogni modulo ha il proprio `model`, `schema`, `service` e `router`. Le dipendenze fluiscono in una sola direzione (api → service → repository → model). Quando un modulo cresce abbastanza (es. payments), diventa un microservizio senza refactor invasivi.

### Modello dati (core)

- **User** — email, password_hash, role (`worker`|`company`), verifica base
- **WorkerProfile** — 1:1 con User; profession, years_experience, lat/lng, travel_radius_km, hourly_rate, ai_score
- **Company** — 1:1 con User; legal_name, vat_number
- **JobPost** — company_id, profession, type, lat/lng, salary range, urgent flag
- **Application** — worker→job, status, match_score
- **Review** — dopo un'application `hired`+`completed`, rating multi-dimensione

Diagramma completo e API in `/docs` una volta avviato.

---

## Sviluppo

### Backend (senza Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://craftik:craftik@localhost:5432/craftik
uvicorn app.main:app --reload
```

### Frontend (senza Docker)

```bash
cd frontend
npm install
npm run dev
```

Variabile: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`

### Migrazioni

Il backend supporta due modalità (env var `MIGRATE_ON_STARTUP`):

- **Sviluppo (default `false`)**: `Base.metadata.create_all` — veloce, senza dipendenze.
- **Produzione (`true`)**: `alembic upgrade head` all'avvio dell'app. La migrazione iniziale è già in `backend/alembic/versions/0001_initial_schema.py`.

Per aggiungere una nuova migrazione dopo aver modificato i modelli:

```bash
cd backend
alembic revision --autogenerate -m "add contracts table"
# rivedi il file generato, poi:
alembic upgrade head
```

### Test

```bash
cd backend
pytest
```

---

## Deploy in produzione

- **Backend**: qualsiasi PaaS che gira container (Fly.io, Railway, Render, ECS). Impostare `SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, `ENVIRONMENT=production`.
- **Frontend**: Vercel (nativo Next.js) oppure Docker su qualsiasi runtime. Variabile `NEXT_PUBLIC_API_URL` che punta al backend pubblico.
- **Database**: Aurora/RDS PostgreSQL 15+ multi-AZ, backup PITR attivo.
- **Media (fase 2)**: S3 + CloudFront.

## Come estendere

**Aggiungere un modulo (es. contratti):**
1. `backend/app/models/contract.py` — SQLAlchemy model
2. `backend/app/schemas/contract.py` — Pydantic DTOs
3. `backend/app/services/contract_service.py` — logica
4. `backend/app/api/contracts.py` — router
5. Aggiungere `contracts_router` in `app/main.py`
6. Frontend: `src/app/(dashboard)/contracts/page.tsx`

Convenzione: un modulo non importa direttamente il model di un altro modulo — passa per il service. Questo prepara l'estrazione a microservizio.

---

## Licenza

Proprietaria. © Craftik 2026.
