'use client';

import { useState } from 'react';

import { api, ApiError } from '@/lib/api';
import type { Badge, Certification, PortfolioItem, ReviewWithAuthor } from '@/lib/types';
import { Button, ErrorBanner, Field, Textarea } from './ui';
import { VerifiedSeal } from './Brand';

/* ---------- Badges ---------- */
export function BadgeRow({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <span
          key={b.code}
          title={b.description}
          className="inline-flex items-center gap-1.5 rounded-full bg-night-2 px-3 py-1.5 text-xs font-bold text-white"
        >
          <span>{b.icon}</span> {b.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Certifications ---------- */
const KIND_LABEL: Record<string, string> = {
  certificazione: 'Certificazione',
  patentino: 'Patentino',
  patente: 'Patente',
};

export function CertList({
  certs,
  onDelete,
}: {
  certs: Certification[];
  onDelete?: (id: number) => void;
}) {
  if (certs.length === 0)
    return <p className="text-sm text-muted">Nessuna certificazione inserita.</p>;
  return (
    <div className="space-y-2">
      {certs.map((c) => (
        <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
          <VerifiedSeal size={22} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-night">{c.name}</div>
            <div className="text-xs text-muted">
              {KIND_LABEL[c.kind]}
              {c.issuer ? ` · ${c.issuer}` : ''}
              {c.expires_year ? ` · scade ${c.expires_year}` : ''}
            </div>
          </div>
          <span className="tag-green">Verificato</span>
          {onDelete && (
            <button
              onClick={() => onDelete(c.id)}
              className="text-xs font-semibold text-muted hover:text-red-600"
              aria-label="Elimina certificazione"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Portfolio ---------- */
const CARD_GRADIENTS = [
  'from-night to-night-2',
  'from-orange to-orange-light',
  'from-emerald-600 to-emerald-400',
  'from-slate-700 to-slate-500',
];

export function PortfolioCard({
  item,
  onDelete,
}: {
  item: PortfolioItem;
  onDelete?: (id: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div
        className={`relative flex h-24 items-end bg-gradient-to-br p-3 ${CARD_GRADIENTS[item.id % CARD_GRADIENTS.length]}`}
      >
        {item.city && (
          <span className="absolute left-3 top-3 rounded-md bg-night/80 px-2 py-1 text-[11px] font-semibold text-white">
            📍 {item.city}
            {item.year ? ` · ${item.year}` : ''}
          </span>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="absolute right-3 top-3 rounded-md bg-white/85 px-2 py-1 text-[11px] font-bold text-night hover:bg-white"
          >
            Elimina
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="font-bold text-night">{item.title}</div>
        <div className="mt-0.5 text-xs text-muted">
          {item.client_name}
          {item.duration_weeks ? ` · ${item.duration_weeks} settimane` : ''}
        </div>
        {item.description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink">{item.description}</p>
        )}
        <div className="mt-3">
          {item.confirmed ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-verified">
              <VerifiedSeal size={14} /> Confermato dall&apos;azienda
            </span>
          ) : item.company_id ? (
            <span className="tag-yellow">In attesa di conferma</span>
          ) : (
            <span className="tag-gray">Autodichiarato</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Reviews ---------- */
export function Stars({ n }: { n: number }) {
  return (
    <span className="text-signal" aria-label={`${n} stelle`}>
      {'★'.repeat(n)}
      <span className="text-line">{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export function ReviewList({ reviews }: { reviews: ReviewWithAuthor[] }) {
  if (reviews.length === 0)
    return <p className="text-sm text-muted">Nessuna recensione ancora.</p>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-night">{r.author_name}</div>
            <Stars n={r.rating} />
          </div>
          {r.comment && <p className="mt-2 text-sm text-ink">&ldquo;{r.comment}&rdquo;</p>}
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-verified">
            <VerifiedSeal size={12} /> Recensione certificata — da ingaggio completato
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Review form (used by both roles after a completed engagement) ---------- */
export function ReviewForm({
  applicationId,
  token,
  onDone,
}: {
  applicationId: number;
  token: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await api.reviews.create(
        applicationId,
        { rating, punctuality: rating, quality: rating, communication: rating, comment: comment || undefined },
        token,
      );
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-line bg-concrete p-4">
      <ErrorBanner message={error} />
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-night">Valutazione:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? 'text-signal' : 'text-line'}`}
            aria-label={`${n} stelle`}
          >
            ★
          </button>
        ))}
      </div>
      <Field label="Commento (opzionale)">
        <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <Button onClick={submit} loading={loading} className="!py-2 !text-xs">
        Invia recensione certificata
      </Button>
    </div>
  );
}
