# Craftik Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS.

## Struttura

```
src/
├── app/                      # Route (App Router)
│   ├── page.tsx             # Landing page
│   ├── login/               # Login
│   ├── register/            # Worker & company registration
│   └── dashboard/
│       ├── worker/          # Worker dashboard, applications, job detail
│       └── company/         # Company dashboard, search, ATS, new job
├── components/              # UI reusable (Button, Card, ScoreRing, DashboardShell...)
├── lib/                     # API client, auth store (zustand), types, utils
└── styles/globals.css       # Tailwind + fonts + reusable class helpers
```

## Come funziona l'auth

- `lib/api.ts`: fetch wrapper con auth bearer token, tipizzato.
- `lib/auth.ts`: zustand store persistito in `localStorage`.
- `lib/useRequireAuth.ts`: hook client-side che redirige a `/login` se non autenticato o alla dashboard corretta se il ruolo non combacia.

Per produzione: sostituire con httpOnly cookies + `middleware.ts` per SSR-safe redirects.

## Estendere

**Aggiungere una nuova pagina**: crea `src/app/nuova/route/page.tsx`. Se è protetta, usa `useRequireAuth('worker' | 'company')` in cima.

**Aggiungere un endpoint API client**: estendi `src/lib/api.ts`. Aggiungi il tipo TS in `src/lib/types.ts` (o meglio, in v2 genera il client dall'OpenAPI del backend con `openapi-typescript` o `orval`).

**Design tokens**: in `tailwind.config.js`. I colori Craftik (orange safety, night blue, verified green) sono definiti lì e usati come classi Tailwind (`bg-orange`, `text-night`).
