'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { api, ApiError } from '@/lib/api';
import type { JobType, Profession } from '@/lib/types';
import { PROFESSIONS, JOB_TYPE_LABEL } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { Button, Card, ErrorBanner, Field, Input, Select, Textarea } from '@/components/ui';
import { CITY_COORDS, CITY_NAMES } from '@/lib/utils';

export default function NewJobPage() {
  const router = useRouter();
  const { token, ready } = useRequireAuth('company');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [profession, setProfession] = useState<Profession>('elettricista');
  const [jobType, setJobType] = useState<JobType>('freelance');
  const [city, setCity] = useState('Milano');
  const [salaryMin, setSalaryMin] = useState(30);
  const [salaryMax, setSalaryMax] = useState(45);
  const [isUrgent, setIsUrgent] = useState(false);
  const [minYears, setMinYears] = useState(2);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const coords = CITY_COORDS[city] ?? CITY_COORDS.Milano;
      const job = await api.jobs.create(
        {
          title, description, profession, job_type: jobType,
          city, latitude: coords.lat, longitude: coords.lng,
          salary_min: salaryMin, salary_max: salaryMax,
          is_urgent: isUrgent, min_years_experience: minYears,
        },
        token,
      );
      router.push(`/dashboard/company/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <DashboardShell role="company" nav={companyNav}>
        <div className="text-muted">Caricamento…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="company" nav={companyNav}>
      <h1 className="mb-6 font-display text-2xl font-black text-night">Pubblica una nuova offerta</h1>

      <div className="max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorBanner message={error} />
            <Field label="Titolo dell'offerta">
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Elettricista senior per cabina MT/BT"
              />
            </Field>
            <Field label="Descrizione" hint="Cantiere, durata, materiali, disponibilità richiesta.">
              <Textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Professione">
                <Select value={profession} onChange={(e) => setProfession(e.target.value as Profession)}>
                  {PROFESSIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tipo">
                <Select value={jobType} onChange={(e) => setJobType(e.target.value as JobType)}>
                  {(['permanent', 'temporary', 'freelance', 'subcontract'] as JobType[]).map((t) => (
                    <option key={t} value={t}>
                      {JOB_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Città">
                <Select value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITY_NAMES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Anni esperienza minimi">
                <Input
                  type="number"
                  min={0}
                  max={40}
                  value={minYears}
                  onChange={(e) => setMinYears(Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label={jobType === 'permanent' ? 'Retribuzione min. (€/mese)' : 'Tariffa min. (€/h)'}>
                <Input
                  type="number"
                  min={1}
                  required
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                />
              </Field>
              <Field label={jobType === 'permanent' ? 'Retribuzione max. (€/mese)' : 'Tariffa max. (€/h)'}>
                <Input
                  type="number"
                  min={1}
                  required
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="h-4 w-4 accent-orange"
              />
              Segna come <span className="text-orange-dark">urgente</span> — visibilità prioritaria
            </label>
            <Button type="submit" fullWidth loading={submitting}>
              Pubblica offerta
            </Button>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
}

const companyNav = [
  { href: '/dashboard/company', label: 'Le mie offerte' },
  { href: '/dashboard/company/search', label: 'Cerca professionisti' },
  { href: '/dashboard/company/jobs/new', label: 'Nuova offerta' },
];
