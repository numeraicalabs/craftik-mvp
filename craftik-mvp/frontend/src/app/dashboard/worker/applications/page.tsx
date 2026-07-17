'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { Application } from '@/lib/types';
import { APP_STATUS_LABEL, JOB_TYPE_LABEL, PROFESSION_LABELS } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { Card } from '@/components/ui';

export default function WorkerApplicationsPage() {
  const { token, ready } = useRequireAuth('worker');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token) return;
    api.applications
      .listMine(token)
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ready, token]);

  return (
    <DashboardShell role="worker" nav={[
      { href: '/dashboard/worker', label: 'Dashboard' },
      { href: '/dashboard/worker/applications', label: 'Le mie candidature' },
    ]}>
      <h1 className="mb-6 font-display text-2xl font-black text-night">Le mie candidature</h1>
      {loading ? (
        <div className="text-muted">Caricamento…</div>
      ) : apps.length === 0 ? (
        <Card>
          <p className="text-muted">
            Non hai ancora inviato candidature.{' '}
            <Link href="/dashboard/worker" className="font-semibold text-orange-dark hover:underline">
              Vedi le offerte disponibili
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-night">{a.job.title}</div>
                  <div className="mt-0.5 text-sm text-muted">
                    {a.job.company.legal_name} · {a.job.city}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="tag-blue">{JOB_TYPE_LABEL[a.job.job_type]}</span>
                    <span className="tag-gray">{PROFESSION_LABELS[a.job.profession]}</span>
                    <span className="tag-green">Match {a.match_score}%</span>
                  </div>
                </div>
                <span
                  className={
                    a.status === 'hired' || a.status === 'completed'
                      ? 'tag-green'
                      : a.status === 'rejected'
                        ? 'tag-gray'
                        : a.status === 'shortlisted' || a.status === 'interview'
                          ? 'tag-yellow'
                          : 'tag-blue'
                  }
                >
                  {APP_STATUS_LABEL[a.status]}
                </span>
              </div>
              {a.cover_message && (
                <div className="mt-3 rounded-lg bg-concrete p-3 text-sm text-ink">
                  &ldquo;{a.cover_message}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
