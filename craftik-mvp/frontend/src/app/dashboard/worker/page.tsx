'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { Application, JobPost, ScoreBreakdown, WorkerProfile } from '@/lib/types';
import { APP_STATUS_LABEL, JOB_TYPE_LABEL, PROFESSION_LABELS } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { ScoreRing, VerifiedSeal } from '@/components/Brand';
import { Card } from '@/components/ui';

export default function WorkerDashboard() {
  const { token, ready } = useRequireAuth('worker');

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (!ready || !token) return;
    api.workers.getMe(token).then(setProfile).catch(console.error);
    api.workers.getScoreBreakdown(token).then(setBreakdown).catch(console.error);
    api.applications.listMine(token).then(setApplications).catch(console.error);
  }, [ready, token]);

  // Once we have the profile, fetch jobs matched to it.
  useEffect(() => {
    if (!ready || !token || !profile) return;
    api.jobs
      .list(
        {
          profession: profile.profession,
          latitude: profile.latitude,
          longitude: profile.longitude,
          radius_km: profile.travel_radius_km,
        },
        token,
      )
      .then(setJobs)
      .catch(console.error);
  }, [ready, token, profile]);

  if (!ready || !profile) {
    return (
      <DashboardShell role="worker" nav={workerNav}>
        <div className="text-muted">Caricamento…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="worker" nav={workerNav}>
      <div className="mb-6">
        <div className="text-sm text-muted">Buongiorno,</div>
        <h1 className="font-display text-3xl font-black text-night">
          {profile.first_name} {profile.last_name}
        </h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted">
          <span className="capitalize">{PROFESSION_LABELS[profile.profession]}</span>
          <span>·</span>
          <span>{profile.city}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Score card */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-night p-6 text-white shadow-card">
            <div className="flex items-center gap-4">
              <ScoreRing value={profile.ai_score} size={92} stroke={9} dark />
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400">
                  Score Craftik
                </div>
                <div className="font-display text-2xl font-black">{profile.ai_score}/100</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-300">
                  <VerifiedSeal size={14} />
                  Identità verificata
                </div>
              </div>
            </div>
            {breakdown && (
              <div className="mt-6 space-y-3">
                {breakdown.components.map((c) => (
                  <div key={c.name}>
                    <div className="mb-1 flex justify-between text-xs text-slate-300">
                      <span>{c.name}</span>
                      <span className="font-semibold text-white">{c.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-orange"
                        style={{ width: `${c.value}%`, transition: 'width 800ms ease' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 rounded-xl bg-white/5 p-3 text-xs text-slate-300">
              Migliora il tuo score: completa il portfolio, chiudi lavori con recensione a 5 stelle,
              aggiungi certificazioni.
            </div>
          </div>

          <Card>
            <div className="text-xs font-bold uppercase tracking-widest text-muted">
              Le tue tariffe
            </div>
            <div className="mt-2 font-display text-2xl font-black text-night">
              € {profile.hourly_rate_min}–{profile.hourly_rate_max}
              <span className="text-sm font-semibold text-muted"> / ora</span>
            </div>
            <div className="mt-4 text-xs text-muted">
              Raggio di trasferta: <b>{profile.travel_radius_km} km</b>
              {profile.willing_to_relocate && ' · aperto a trasferte in Europa'}
            </div>
          </Card>
        </div>

        {/* Main column */}
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-black text-night">Offerte per te</h2>
              <Link
                href="/dashboard/worker/applications"
                className="text-sm font-semibold text-orange-dark hover:underline"
              >
                Le mie candidature →
              </Link>
            </div>
            {jobs.length === 0 ? (
              <Card>
                <p className="text-sm text-muted">
                  Nessuna offerta al momento nella tua zona. Amplia il raggio di trasferta dal tuo profilo
                  per vedere più opportunità.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 6).map((j) => (
                  <JobRow key={j.id} job={j} />
                ))}
              </div>
            )}
          </section>

          {applications.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-black text-night">
                Le tue candidature recenti
              </h2>
              <div className="space-y-3">
                {applications.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4"
                  >
                    <div>
                      <div className="font-semibold text-night">{a.job.title}</div>
                      <div className="text-xs text-muted">
                        {a.job.company.legal_name} · match {a.match_score}%
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function JobRow({ job }: { job: JobPost }) {
  return (
    <Link
      href={`/dashboard/worker/jobs/${job.id}`}
      className="block rounded-xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-orange hover:shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-night">{job.title}</div>
          <div className="mt-0.5 text-xs text-muted">
            {job.company.legal_name} · {job.city}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.is_urgent && <span className="tag-orange">Urgente</span>}
            <span className="tag-blue">{JOB_TYPE_LABEL[job.job_type]}</span>
            <span className="tag-gray">{PROFESSION_LABELS[job.profession]}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-black text-night">
            € {job.salary_min}–{job.salary_max}
          </div>
          <div className="text-xs text-muted">
            {job.job_type === 'permanent' ? '/mese' : '/ora'}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: Application['status'] }) {
  const style: Record<Application['status'], string> = {
    applied: 'tag-blue',
    shortlisted: 'tag-yellow',
    interview: 'tag-yellow',
    hired: 'tag-green',
    rejected: 'tag-gray',
    completed: 'tag-green',
  };
  return <span className={style[status]}>{APP_STATUS_LABEL[status]}</span>;
}

const workerNav = [
  { href: '/dashboard/worker', label: 'Dashboard' },
  { href: '/dashboard/worker/applications', label: 'Le mie candidature' },
];
