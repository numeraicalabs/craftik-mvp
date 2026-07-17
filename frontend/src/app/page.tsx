import Link from 'next/link';
import { Button } from '@/components/ui';
import { Logo, ScoreRing, VerifiedSeal } from '@/components/Brand';

export default function LandingPage() {
  return (
    <>
      {/* NAV */}
      <nav className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-muted hover:text-night sm:inline">
              Accedi
            </Link>
            <Link href="/register/worker">
              <Button variant="primary">Inizia gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden bg-night text-white">
        <div className="grid-bg absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.05fr_.95fr] md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-signal/15 px-3 py-2 text-xs font-bold uppercase tracking-widest text-signal">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
              La piattaforma europea del lavoro specializzato
            </span>
            <h1 className="mt-6 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Where skills become <span className="text-orange">opportunities</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Ogni cantiere completato diventa reputazione verificata. Le aziende trovano professionisti
              affidabili in minuti, con score AI e portfolio geolocalizzato.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register/worker">
                <Button variant="primary">Sono un professionista →</Button>
              </Link>
              <Link href="/register/company">
                <Button
                  variant="ghost"
                  className="border-white/30 text-white hover:border-white"
                >
                  Sono un&apos;azienda →
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-8">
              <Stat n="12.480" l="Professionisti verificati" />
              <Stat n="940" l="Aziende attive" />
              <Stat n="31.200" l="Cantieri documentati" />
            </div>
          </div>

          {/* Preview card — echoes the mockup */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-sm rounded-3xl border-8 border-night-2 bg-night-2 p-3 shadow-2xl">
              <div className="rounded-2xl bg-concrete overflow-hidden">
                <div className="bg-night p-4 text-white">
                  <div className="text-xs text-slate-400">Buongiorno,</div>
                  <div className="font-display font-black">Marco Bianchi · Elettricista</div>
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-night-2 p-3">
                    <ScoreRing value={78} size={54} stroke={6} dark />
                    <div>
                      <div className="font-display font-bold text-sm">Score Craftik 78</div>
                      <div className="text-xs text-slate-400">Top 5% nella tua zona</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                    Offerte per te
                  </div>
                  <div className="mb-2 rounded-xl bg-white p-3 shadow-sm">
                    <div className="text-sm font-bold text-night">Impianto cabina MT/BT</div>
                    <div className="text-xs text-muted">Edilcostruzioni SpA · 8 km · €38/h</div>
                    <div className="mt-2 flex gap-1">
                      <span className="tag-orange">Urgente</span>
                      <span className="tag-green">Match 94%</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="text-sm font-bold text-night">Quadri elettrici residenziale</div>
                    <div className="text-xs text-muted">GruppoCasa Srl · 15 km · €35/h</div>
                  </div>
                </div>
              </div>
              <FloatingChip className="-left-4 top-8">
                <VerifiedSeal size={16} />
                Patentino verificato
              </FloatingChip>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-orange">
          Come funziona
        </div>
        <h2 className="font-display text-3xl font-black tracking-tight text-night md:text-4xl">
          Dal cantiere alla reputazione,
          <br />
          in tre passaggi
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          Craftik trasforma ogni lavoro completato in una prova verificata delle tue competenze.
        </p>
        <div className="mt-12 grid gap-6 text-left md:grid-cols-3">
          <Step
            num="1"
            title="Crea la tua identità professionale"
            body="Profilo in 5 minuti da smartphone: professione, esperienza, geolocalizzazione, tariffa oraria."
            bg="bg-orange-soft"
          />
          <Step
            num="2"
            title="Cerca o candidati con 1 tap"
            body="Il match AI mostra le opportunità più compatibili per distanza, competenze e disponibilità."
            bg="bg-blue-50"
          />
          <Step
            num="3"
            title="Recensioni certificate, score che cresce"
            body="Ogni lavoro completato con una recensione sblocca fiducia. Score e tariffa salgono con te."
            bg="bg-emerald-50"
          />
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="bg-night text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-xs font-bold uppercase tracking-widest text-orange">
            L&apos;infrastruttura della fiducia
          </div>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">
            Il CV racconta.
            <br />
            Craftik dimostra.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Feature
              title="Identità e patentini verificati"
              body="Verifica email, P.IVA aziendale; in v2, KYC documento e patentini via OCR."
            />
            <Feature
              title="Score AI 0–100 spiegabile"
              body="Vedi esattamente perché il tuo punteggio è quello che è. Ogni componente ha un peso, ogni miglioramento un impatto."
            />
            <Feature
              title="Recensioni certificate"
              body="Puoi essere recensito solo da un'azienda con cui hai effettivamente lavorato. Zero recensioni fake."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-3xl bg-gradient-to-r from-orange to-orange-light p-12 text-white shadow-cta">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl font-black md:text-3xl">
                12 milioni di professionisti costruiscono l&apos;Europa.
                <br />
                Diamo loro la reputazione che meritano.
              </h2>
            </div>
            <div className="flex gap-3">
              <Link href="/register/worker">
                <Button variant="dark" className="bg-white text-orange-dark hover:bg-white/90">
                  Inizia gratis →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-night py-12 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-8 px-6">
          <div className="flex items-center gap-2 font-display font-black text-white">
            <svg viewBox="0 0 40 40" className="h-8 w-8">
              <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#FF6B1A" />
              <path
                d="M13 20.5l5 5 9-11"
                stroke="#fff"
                strokeWidth="3.4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            craftik
          </div>
          <div className="text-sm leading-relaxed">
            Where skills become opportunities.
            <br />© 2026 Craftik · MVP
          </div>
        </div>
      </footer>
    </>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-black">{n}</div>
      <div className="mt-0.5 text-xs text-slate-400">{l}</div>
    </div>
  );
}

function Step({ num, title, body, bg }: { num: string; title: string; body: string; bg: string }) {
  return (
    <div className="rounded-2xl bg-concrete p-8 transition hover:-translate-y-1">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl font-display text-xl font-black text-night ${bg}`}>
        {num}
      </div>
      <h3 className="mb-2 font-display text-lg font-black text-night">{title}</h3>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-night-2 p-6">
      <div className="mb-3 h-10 w-10 rounded-lg bg-orange/15 grid place-items-center">
        <VerifiedSeal size={20} />
      </div>
      <h4 className="mb-2 font-display font-black">{title}</h4>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

function FloatingChip({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute z-10 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-ink shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
