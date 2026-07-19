'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type { Badge, Certification, PortfolioItemFull, ReviewWithAuthor, WorkerProfile } from '@/lib/types';
import { PROFESSION_LABELS } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuth } from '@/lib/auth';
import { DashboardShell } from '@/components/DashboardShell';
import { ScoreRing, VerifiedSeal } from '@/components/Brand';
import { BadgeRow, CertList, ReviewList } from '@/components/Trust';
import { PortfolioSocialCard } from '@/components/PortfolioSocial';
import { Button, Card } from '@/components/ui';
import { avatarGradient, initials } from '@/lib/utils';

const NAV = [
  { href: '/dashboard/company', label: 'Le mie offerte' },
  { href: '/dashboard/company/search', label: 'Cerca professionisti' },
  { href: '/dashboard/messages', label: 'Messaggi' },
];

export default function WorkerPublicProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token, ready } = useRequireAuth('company');
  const currentUserId = useAuth((st) => st.userId);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItemFull[]>([]);
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [contacting, setContacting] = useState(false);

  const workerId = Number(params.id);

  useEffect(() => {
    if (!ready || !token || !workerId) return;
    api.workers.getById(workerId, token).then(setWorker).catch(console.error);
    api.badges.forWorker(workerId, token).then(setBadges).catch(console.error);
    api.certifications.listForWorker(workerId, token).then(setCerts).catch(console.error);
    api.portfolio.listFull(workerId, token).then(setPortfolio).catch(console.error);
    api.reviews.forWorker(workerId, token).then(setReviews).catch(console.error);
  }, [ready, token, workerId]);

  async function contact() {
    if (!token || !worker) return;
    setContacting(true);
    try {
      await api.messages.openConversation(worker.user_id, token);
      router.push('/dashboard/messages');
    } catch (e) {
      console.error(e);
      setContacting(false);
    }
  }

  if (!ready || !worker) {
    return (
      <DashboardShell role="company" nav={NAV}>
        <div className="text-muted">Caricamento…</div>
      </DashboardShell>
    );
  }

  const confirmedCount = portfolio.filter((p) => p.confirmed).length;

  return (
    <DashboardShell role="company" nav={NAV}>
      <button onClick={() => router.back()} className="mb-6 text-sm font-semibold text-muted hover:text-night">
        ← Torna ai risultati
      </button>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left column: identity + score */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-night p-6 text-white shadow-card">
            <div className="flex items-center gap-4">
              <div className={`flex h-16 w-16 flex-none items-center justify-center rounded-full bg-gradient-to-br font-display text-xl font-black text-white ${avatarGradient(worker.id)}`}>
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
                  {confirmedCount} lavori confermati · {certs.length} certificazioni
                </div>
              </div>
            </div>
            <div className="mt-5">
              <BadgeRow badges={badges} />
            </div>
            <Button onClick={contact} loading={contacting} fullWidth className="mt-6">
              💬 Contatta {worker.first_name}
            </Button>
          </div>

          <Card>
            <h3 className="mb-3 font-display font-black text-night">Info</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Esperienza</dt><dd className="font-semibold text-night">{worker.years_experience} anni</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Tariffa</dt><dd className="font-semibold text-night">€ {worker.hourly_rate_min}–{worker.hourly_rate_max}/h</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Raggio</dt><dd className="font-semibold text-night">{worker.travel_radius_km} km{worker.willing_to_relocate ? ' · trasferte EU' : ''}</dd></div>
            </dl>
          </Card>

          <Card>
            <h3 className="mb-3 font-display font-black text-night">Certificazioni</h3>
            <CertList certs={certs} />
          </Card>
        </div>

        {/* Right column: bio + portfolio + reviews */}
        <div className="space-y-6">
          {worker.bio && (
            <Card>
              <h3 className="mb-2 font-display font-black text-night">Chi è</h3>
              <p className="text-sm leading-relaxed text-ink">{worker.bio}</p>
            </Card>
          )}

          <section>
            <h3 className="mb-3 font-display text-lg font-black text-night">
              Portfolio · {portfolio.length} lavori ({confirmedCount} confermati)
            </h3>
            {portfolio.length === 0 ? (
              <Card><p className="text-sm text-muted">Nessun lavoro documentato.</p></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {portfolio.map((it) => (
                  <PortfolioSocialCard key={it.id} item={it} token={token!} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 font-display text-lg font-black text-night">
              Recensioni certificate · {reviews.length}
            </h3>
            <ReviewList reviews={reviews} />
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
