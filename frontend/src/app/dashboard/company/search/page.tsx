'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { api } from '@/lib/api';
import type { Profession, WorkerSearchResult } from '@/lib/types';
import { PROFESSIONS, PROFESSION_LABELS } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { ScoreRing, VerifiedSeal } from '@/components/Brand';
import { Card, Field, Select } from '@/components/ui';
import { CITY_COORDS, CITY_NAMES, avatarGradient, initials } from '@/lib/utils';

export default function CompanySearchPage() {
  const { token, ready } = useRequireAuth('company');

  const [profession, setProfession] = useState<Profession | ''>('');
  const [city, setCity] = useState('Milano');
  const [radius, setRadius] = useState(50);
  const [minScore, setMinScore] = useState(0);
  const [results, setResults] = useState<WorkerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const coords = useMemo(() => CITY_COORDS[city] ?? CITY_COORDS.Milano, [city]);

  useEffect(() => {
    if (!ready || !token) return;
    setLoading(true);
    api.workers
      .search(
        { profession, latitude: coords.lat, longitude: coords.lng, radius_km: radius, min_score: minScore },
        token,
      )
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ready, token, profession, coords, radius, minScore]);

  return (
    <DashboardShell role="company" nav={companyNav}>
      <h1 className="mb-2 font-display text-2xl font-black text-night">Cerca professionisti</h1>
      <p className="mb-6 text-muted">
        Trova lavoratori verificati vicino ai tuoi cantieri. Ordinati per match e reputazione.
      </p>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside>
          <Card>
            <h3 className="mb-4 font-display font-black text-night">Filtri</h3>
            <div className="space-y-4">
              <Field label="Professione">
                <Select value={profession} onChange={(e) => setProfession(e.target.value as Profession | '')}>
                  <option value="">Tutte le professioni</option>
                  {PROFESSIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Città di riferimento">
                <Select value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITY_NAMES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label={`Raggio: ${radius} km`}>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-orange"
                />
              </Field>
              <Field label={`Score minimo: ${minScore}`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-orange"
                />
              </Field>
            </div>
          </Card>
        </aside>

        <div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="font-semibold text-night">
              {loading ? 'Ricerca in corso…' : `${results.length} professionist${results.length === 1 ? 'a' : 'i'} trovat${results.length === 1 ? 'o' : 'i'}`}
            </div>
          </div>
          {results.length === 0 && !loading ? (
            <Card>
              <p className="text-muted">Nessun risultato con questi filtri. Prova ad ampliare il raggio o abbassare il punteggio minimo.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((w) => (
                <WorkerCard key={w.id} worker={w} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function WorkerCard({ worker }: { worker: WorkerSearchResult }) {
  return (
    <Link
      href={`/dashboard/company/workers/${worker.id}`}
      className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-orange hover:shadow-card"
    >
      <div
        className={`flex h-14 w-14 flex-none items-center justify-center rounded-full bg-gradient-to-br font-display text-lg font-black text-white ${avatarGradient(worker.id)}`}
      >
        {initials(worker.first_name, worker.last_name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 font-semibold text-night">
          {worker.first_name} {worker.last_name}
          <VerifiedSeal size={14} />
        </div>
        <div className="text-sm text-muted">
          {PROFESSION_LABELS[worker.profession]} · {worker.years_experience}y esperienza
        </div>
        <div className="text-xs text-muted">
          {worker.city} · {worker.distance_km} km · € {worker.hourly_rate_min}–{worker.hourly_rate_max}/h
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <ScoreRing value={worker.ai_score} size={54} stroke={6} />
        <span className="tag-green">Match {worker.match_score}%</span>
      </div>
    </Link>
  );
}

const companyNav = [
  { href: '/dashboard/company', label: 'Le mie offerte' },
  { href: '/dashboard/company/search', label: 'Cerca professionisti' },
  { href: '/dashboard/company/jobs/new', label: 'Nuova offerta' },
  { href: '/dashboard/messages', label: 'Messaggi' },
];
