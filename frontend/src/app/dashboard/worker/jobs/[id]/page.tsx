'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import type { JobPost } from '@/lib/types';
import { JOB_TYPE_LABEL, PROFESSION_LABELS } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { Button, Card, ErrorBanner, Field, Textarea } from '@/components/ui';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, ready } = useRequireAuth('worker');

  const [job, setJob] = useState<JobPost | null>(null);
  const [cover, setCover] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const jobId = Number(params.id);

  useEffect(() => {
    if (!ready || !token || !jobId) return;
    api.jobs.getById(jobId, token).then(setJob).catch(console.error);
  }, [ready, token, jobId]);

  async function handleApply() {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.applications.apply(jobId, cover, token);
      setApplied(true);
      setTimeout(() => router.push('/dashboard/worker/applications'), 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || !job) {
    return (
      <DashboardShell role="worker" nav={workerNav}>
        <div className="text-muted">Caricamento…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="worker" nav={workerNav}>
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm font-semibold text-muted hover:text-night"
      >
        ← Torna indietro
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted">{job.company.legal_name}</div>
              <h1 className="font-display text-2xl font-black text-night">{job.title}</h1>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-black text-night">
                € {job.salary_min}–{job.salary_max}
              </div>
              <div className="text-xs text-muted">
                {job.job_type === 'permanent' ? '/mese lordo' : '/ora'}
              </div>
            </div>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {job.is_urgent && <span className="tag-orange">Urgente</span>}
            <span className="tag-blue">{JOB_TYPE_LABEL[job.job_type]}</span>
            <span className="tag-gray">{PROFESSION_LABELS[job.profession]}</span>
            <span className="tag-gray">{job.city}</span>
            <span className="tag-gray">Min {job.min_years_experience}y esperienza</span>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-line text-ink">
            {job.description}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="mb-4 font-display font-black text-night">Candidati a questa offerta</h3>
            {applied ? (
              <div className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                ✓ Candidatura inviata! Ti reindirizzo…
              </div>
            ) : (
              <div className="space-y-4">
                <ErrorBanner message={error} />
                <Field
                  label="Messaggio (opzionale)"
                  htmlFor="cover"
                  hint="Racconta perché sei la persona giusta."
                >
                  <Textarea
                    id="cover"
                    rows={4}
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    placeholder="Es. Ho realizzato 3 cabine MT/BT simili nell'ultimo anno…"
                  />
                </Field>
                <Button onClick={handleApply} fullWidth loading={submitting}>
                  Candidati con 1 tap →
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

const workerNav = [
  { href: '/dashboard/worker', label: 'Dashboard' },
  { href: '/dashboard/worker/portfolio', label: 'Portfolio' },
  { href: '/dashboard/worker/applications', label: 'Candidature' },
  { href: '/dashboard/messages', label: 'Messaggi' },
  { href: '/dashboard/worker/profile', label: 'Profilo' },
];
