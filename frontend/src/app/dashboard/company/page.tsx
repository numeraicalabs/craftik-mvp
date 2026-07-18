'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { Company, JobPost, PortfolioItem } from '@/lib/types';
import { JOB_TYPE_LABEL, PROFESSION_LABELS } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { Button, Card } from '@/components/ui';

export default function CompanyDashboard() {
  const { token, ready } = useRequireAuth('company');
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [pending, setPending] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    if (!ready || !token) return;
    api.companies.getMe(token).then(setCompany).catch(console.error);
    api.jobs.listMine(token).then(setJobs).catch(console.error);
    api.portfolio.pendingConfirmations(token).then(setPending).catch(console.error);
  }, [ready, token]);

  if (!ready || !company) {
    return (
      <DashboardShell role="company" nav={companyNav}>
        <div className="text-muted">Caricamento…</div>
      </DashboardShell>
    );
  }

  const openJobs = jobs.filter((j) => j.status === 'open').length;

  return (
    <DashboardShell role="company" nav={companyNav}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm text-muted">{company.city} · P.IVA {company.vat_number}</div>
          <h1 className="font-display text-3xl font-black text-night">{company.legal_name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/company/search">
            <Button variant="outline">Cerca professionisti</Button>
          </Link>
          <Link href="/dashboard/company/jobs/new">
            <Button>+ Pubblica offerta</Button>
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard label="Offerte aperte" value={String(openJobs)} />
        <StatCard label="Offerte totali" value={String(jobs.length)} />
        <StatCard label="Dipendenti" value={String(company.employee_count)} />
      </div>

      {pending.length > 0 && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-display text-lg font-black text-night">
            ⬢ {pending.length} lavor{pending.length === 1 ? 'o' : 'i'} da confermare
          </h2>
          <p className="mb-3 text-sm text-muted">
            Professionisti che dichiarano di aver lavorato con la tua azienda. Confermando, il lavoro
            diventa verificato e pesa sul loro score.
          </p>
          <div className="space-y-2">
            {pending.map((it) => (
              <div key={it.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
                <div>
                  <div className="text-sm font-bold text-night">{it.title}</div>
                  <div className="text-xs text-muted">{it.city} · {it.year}</div>
                </div>
                <Button
                  className="!px-4 !py-2 !text-xs"
                  onClick={async () => {
                    if (!token) return;
                    await api.portfolio.confirm(it.id, token).catch(console.error);
                    setPending((xs) => xs.filter((x) => x.id !== it.id));
                  }}
                >
                  ✓ Conferma lavoro
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 font-display text-xl font-black text-night">Le tue offerte</h2>
      {jobs.length === 0 ? (
        <Card>
          <p className="text-muted">
            Non hai ancora pubblicato offerte.{' '}
            <Link href="/dashboard/company/jobs/new" className="font-semibold text-orange-dark hover:underline">
              Pubblica la prima
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              href={`/dashboard/company/jobs/${j.id}`}
              className="block rounded-xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange hover:shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-night">{j.title}</div>
                  <div className="mt-0.5 text-xs text-muted">{j.city}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {j.is_urgent && <span className="tag-orange">Urgente</span>}
                    <span className="tag-blue">{JOB_TYPE_LABEL[j.job_type]}</span>
                    <span className="tag-gray">{PROFESSION_LABELS[j.profession]}</span>
                    <span className={j.status === 'open' ? 'tag-green' : 'tag-gray'}>
                      {j.status === 'open' ? 'Aperta' : j.status === 'filled' ? 'Assegnata' : 'Chiusa'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-black text-night">
                    € {j.salary_min}–{j.salary_max}
                  </div>
                  <div className="text-xs text-muted">
                    {j.job_type === 'permanent' ? '/mese' : '/ora'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-2 font-display text-3xl font-black text-night">{value}</div>
    </div>
  );
}

const companyNav = [
  { href: '/dashboard/company', label: 'Le mie offerte' },
  { href: '/dashboard/company/search', label: 'Cerca professionisti' },
  { href: '/dashboard/company/jobs/new', label: 'Nuova offerta' },
  { href: '/dashboard/messages', label: 'Messaggi' },
];
