'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import type { Application, ApplicationStatus, JobPost } from '@/lib/types';
import { APP_STATUS_LABEL, JOB_TYPE_LABEL, PROFESSION_LABELS } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { ScoreRing, VerifiedSeal } from '@/components/Brand';
import { Button, Card, ErrorBanner } from '@/components/ui';
import { ReviewForm } from '@/components/Trust';
import { avatarGradient, initials } from '@/lib/utils';

export default function CompanyJobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, ready } = useRequireAuth('company');
  const jobId = Number(params.id);

  const [job, setJob] = useState<JobPost | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!ready || !token || !jobId) return;
    api.jobs.getById(jobId, token).then(setJob).catch(console.error);
    api.applications.listForJob(jobId, token).then(setApplications).catch(console.error);
  }, [ready, token, jobId]);

  async function updateStatus(app: Application, status: ApplicationStatus) {
    if (!token) return;
    setError(null);
    try {
      const updated = await api.applications.updateStatus(app.id, status, token);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      if (status === 'hired' && job) setJob({ ...job, status: 'filled' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    }
  }

  if (!ready || !job) {
    return (
      <DashboardShell role="company" nav={companyNav}>
        <div className="text-muted">Caricamento…</div>
      </DashboardShell>
    );
  }

  // Group applications by status for kanban view.
  const cols: { status: ApplicationStatus; label: string }[] = [
    { status: 'applied', label: 'Nuove' },
    { status: 'shortlisted', label: 'Shortlist' },
    { status: 'interview', label: 'Colloquio' },
    { status: 'hired', label: 'Ingaggiati' },
  ];

  return (
    <DashboardShell role="company" nav={companyNav}>
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm font-semibold text-muted hover:text-night"
      >
        ← Torna
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {job.is_urgent && <span className="tag-orange">Urgente</span>}
            <span className="tag-blue">{JOB_TYPE_LABEL[job.job_type]}</span>
            <span className="tag-gray">{PROFESSION_LABELS[job.profession]}</span>
            <span className={job.status === 'open' ? 'tag-green' : 'tag-gray'}>
              {job.status === 'open' ? 'Aperta' : job.status === 'filled' ? 'Assegnata' : 'Chiusa'}
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-black text-night">{job.title}</h1>
          <div className="text-sm text-muted">
            {job.city} · € {job.salary_min}–{job.salary_max} {job.job_type === 'permanent' ? '/mese' : '/ora'}
          </div>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="mb-6 rounded-2xl bg-white p-6 shadow-card">
        <div className="whitespace-pre-line text-sm leading-relaxed text-ink">{job.description}</div>
      </div>

      <h2 className="mb-3 font-display text-xl font-black text-night">
        Candidati ({applications.length})
      </h2>

      <div className="grid gap-4 lg:grid-cols-4">
        {cols.map((col) => {
          const items = applications.filter((a) => a.status === col.status);
          return (
            <div key={col.status} className="min-h-[200px] rounded-2xl bg-white p-3 shadow-card">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="text-xs font-bold uppercase tracking-widest text-muted">
                  {col.label}
                </div>
                <div className="rounded-full bg-concrete px-2 py-0.5 text-xs font-bold text-night">
                  {items.length}
                </div>
              </div>
              <div className="space-y-2">
                {items.map((a) => (
                  <ApplicantCard key={a.id} app={a} onUpdate={updateStatus} />
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-muted">
                    Nessuno qui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {applications.some((a) => a.status === 'rejected' || a.status === 'completed') && (
        <div className="mt-6">
          <h3 className="mb-3 font-display text-sm font-black uppercase tracking-widest text-muted">
            Archivio
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {applications
              .filter((a) => a.status === 'rejected' || a.status === 'completed')
              .map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-line bg-white p-3">
                  <div className="text-sm">
                    <div className="font-semibold text-night">
                      {a.worker.first_name} {a.worker.last_name}
                    </div>
                    <div className="text-xs text-muted">Match {a.match_score}%</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.status === 'completed' && !reviewed.has(a.id) && (
                      <button
                        onClick={() => setReviewing(reviewing === a.id ? null : a.id)}
                        className="text-xs font-bold text-orange-dark hover:underline"
                      >
                        ★ Recensisci
                      </button>
                    )}
                    {reviewed.has(a.id) && <span className="text-xs font-semibold text-verified">✓ Inviata</span>}
                    <span className={a.status === 'completed' ? 'tag-green' : 'tag-gray'}>
                      {APP_STATUS_LABEL[a.status]}
                    </span>
                  </div>
                </div>
              ))}
            {reviewing !== null && token && (
              <div className="mt-3">
                <ReviewForm
                  applicationId={reviewing}
                  token={token}
                  onDone={() => {
                    setReviewed((s) => new Set(s).add(reviewing));
                    setReviewing(null);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function ApplicantCard({
  app,
  onUpdate,
}: {
  app: Application;
  onUpdate: (app: Application, status: ApplicationStatus) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const w = app.worker;

  const nextActions: { label: string; status: ApplicationStatus; variant?: 'primary' | 'ghost' }[] = (
    {
      applied: [
        { label: '→ Shortlist', status: 'shortlisted' as ApplicationStatus, variant: 'primary' as const },
        { label: 'Rifiuta', status: 'rejected' as ApplicationStatus, variant: 'ghost' as const },
      ],
      shortlisted: [
        { label: '→ Colloquio', status: 'interview' as ApplicationStatus, variant: 'primary' as const },
        { label: 'Rifiuta', status: 'rejected' as ApplicationStatus, variant: 'ghost' as const },
      ],
      interview: [
        { label: 'Ingaggia', status: 'hired' as ApplicationStatus, variant: 'primary' as const },
        { label: 'Rifiuta', status: 'rejected' as ApplicationStatus, variant: 'ghost' as const },
      ],
      hired: [
        { label: 'Segna completato', status: 'completed' as ApplicationStatus, variant: 'primary' as const },
      ],
    } as Record<string, { label: string; status: ApplicationStatus; variant?: 'primary' | 'ghost' }[]>
  )[app.status] ?? [];

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen((o) => !o)}>
        <div
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br font-display text-sm font-black text-white ${avatarGradient(w.id)}`}
        >
          {initials(w.first_name, w.last_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm font-semibold text-night">
            {w.first_name} {w.last_name} <VerifiedSeal size={12} />
          </div>
          <div className="text-xs text-muted">
            Score {w.ai_score} · Match {app.match_score}%
          </div>
        </div>
        <ScoreRing value={app.match_score} size={36} stroke={4} />
      </button>
      {open && (
        <div className="mt-3 border-t border-line pt-3 text-xs text-muted">
          {app.cover_message && (
            <div className="mb-3 rounded-lg bg-concrete p-2 text-ink">&ldquo;{app.cover_message}&rdquo;</div>
          )}
          <div className="space-y-1">
            <div>{w.years_experience}y esperienza · {w.city}</div>
            <div>€ {w.hourly_rate_min}–{w.hourly_rate_max}/h · raggio {w.travel_radius_km}km</div>
          </div>
          {nextActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {nextActions.map((a) => (
                <Button
                  key={a.status}
                  variant={a.variant ?? 'primary'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(app, a.status);
                  }}
                  className="!px-3 !py-2 !text-xs"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const companyNav = [
  { href: '/dashboard/company', label: 'Le mie offerte' },
  { href: '/dashboard/company/search', label: 'Cerca professionisti' },
  { href: '/dashboard/company/jobs/new', label: 'Nuova offerta' },
  { href: '/dashboard/messages', label: 'Messaggi' },
];
