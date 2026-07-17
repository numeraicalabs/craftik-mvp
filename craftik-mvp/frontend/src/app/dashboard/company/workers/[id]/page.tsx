'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { WorkerProfile } from '@/lib/types';
import { PROFESSION_LABELS } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { ScoreRing, VerifiedSeal } from '@/components/Brand';
import { Card } from '@/components/ui';
import { avatarGradient, initials } from '@/lib/utils';

export default function WorkerPublicProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, ready } = useRequireAuth('company');
  const [worker, setWorker] = useState<WorkerProfile | null>(null);

  const workerId = Number(params.id);

  useEffect(() => {
    if (!ready || !token || !workerId) return;
    api.workers.getById(workerId, token).then(setWorker).catch(console.error);
  }, [ready, token, workerId]);

  if (!ready || !worker) {
    return (
      <DashboardShell role="company" nav={companyNav}>
        <div className="text-muted">Caricamento…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="company" nav={companyNav}>
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm font-semibold text-muted hover:text-night"
      >
        ← Torna ai risultati
      </button>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-2xl bg-night p-6 text-white shadow-card">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 flex-none items-center justify-center rounded-full bg-gradient-to-br font-display text-xl font-black text-white ${avatarGradient(worker.id)}`}
            >
              {initials(worker.first_name, worker.last_name)}
            </div>
            <div>
              <div className="flex items-center gap-2 font-display text-xl font-black">
                {worker.first_name} {worker.last_name}
                <VerifiedSeal size={16} />
              </div>
              <div className="text-sm text-slate-400">
                {PROFESSION_LABELS[worker.profession]} · {worker.city}
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <ScoreRing value={worker.ai_score} size={84} stroke={9} dark />
            <div>
              <div className="font-display font-black">Score Craftik</div>
              <div className="text-xs leading-relaxed text-slate-400">
                Calcolato su lavori verificati,
                <br />
                puntualità, recensioni e certificazioni.
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <MiniStat n={String(worker.years_experience)} l="Anni esp." />
            <MiniStat n={`${worker.travel_radius_km}km`} l="Trasferta" />
            <MiniStat n={`€${worker.hourly_rate_min}-${worker.hourly_rate_max}`} l="Tariffa/h" />
          </div>
        </div>

        <div className="space-y-4">
          {worker.bio && (
            <Card>
              <h3 className="mb-2 font-display font-black text-night">Chi è</h3>
              <p className="text-sm leading-relaxed text-ink">{worker.bio}</p>
            </Card>
          )}
          <Card>
            <h3 className="mb-3 font-display font-black text-night">Info professionali</h3>
            <dl className="grid gap-3 text-sm">
              <Row label="Professione">{PROFESSION_LABELS[worker.profession]}</Row>
              <Row label="Esperienza">{worker.years_experience} anni</Row>
              <Row label="Città">{worker.city}</Row>
              <Row label="Raggio di trasferta">
                {worker.travel_radius_km} km
                {worker.willing_to_relocate && ' · aperto a trasferte in Europa'}
              </Row>
              <Row label="Disponibilità">{formatAvail(worker.availability)}</Row>
              <Row label="Tariffa oraria">
                € {worker.hourly_rate_min}–{worker.hourly_rate_max}/h
              </Row>
            </dl>
          </Card>
          <Card>
            <h3 className="mb-2 font-display font-black text-night">Contatta questo professionista</h3>
            <p className="text-sm text-muted">
              Pubblica un&apos;offerta e invita <b>{worker.first_name}</b> a candidarsi. Contatti diretti
              e chat sbloccati con Premium Azienda (roadmap post-MVP).
            </p>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function MiniStat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-xl bg-night-2 p-2 text-center">
      <div className="font-display text-sm font-black">{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{l}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-line pb-2 last:border-none last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-night">{children}</dd>
    </div>
  );
}

function formatAvail(a: string): string {
  switch (a) {
    case 'immediate': return 'Immediata';
    case 'within_week': return 'Entro una settimana';
    case 'within_month': return 'Entro un mese';
    default: return 'Non disponibile';
  }
}

const companyNav = [
  { href: '/dashboard/company', label: 'Le mie offerte' },
  { href: '/dashboard/company/search', label: 'Cerca professionisti' },
  { href: '/dashboard/company/jobs/new', label: 'Nuova offerta' },
];
