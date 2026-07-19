'use client';

import { useState } from 'react';

import { api } from '@/lib/api';
import type { PortfolioComment, PortfolioItemFull } from '@/lib/types';
import { VerifiedSeal } from './Brand';

/**
 * Instagram-style card for a portfolio work: photo gallery, like button,
 * comments thread. Read-only actions require a token; owner can manage photos
 * from the dedicated portfolio management page.
 */
export function PortfolioSocialCard({
  item,
  token,
  currentUserId,
}: {
  item: PortfolioItemFull;
  token: string;
  currentUserId: number | null;
}) {
  const [liked, setLiked] = useState(item.liked_by_me);
  const [likeCount, setLikeCount] = useState(item.like_count);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PortfolioComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [commentCount, setCommentCount] = useState(item.comment_count);

  const photos = item.photos;
  const hasPhotos = photos.length > 0;

  async function toggleLike() {
    // optimistic
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await api.portfolio.toggleLike(item.id, token);
      setLiked(res.liked);
      setLikeCount(res.like_count);
    } catch {
      // revert
      setLiked((v) => !v);
      setLikeCount((c) => c + (liked ? 1 : -1));
    }
  }

  async function openComments() {
    setShowComments((s) => !s);
    if (!commentsLoaded) {
      try {
        const cs = await api.portfolio.listComments(item.id, token);
        setComments(cs);
        setCommentCount(cs.length);
        setCommentsLoaded(true);
      } catch {
        /* ignore */
      }
    }
  }

  async function sendComment() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      const c = await api.portfolio.addComment(item.id, body, token);
      setComments((cs) => [...cs, c]);
      setCommentCount((n) => n + 1);
    } catch {
      setDraft(body);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      {/* Photo gallery or gradient fallback */}
      <div className="relative aspect-[4/3] bg-night">
        {hasPhotos ? (
          <>
            <img
              src={photos[photoIdx].data_url}
              alt={photos[photoIdx].caption ?? item.title}
              className="h-full w-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-night hover:bg-white"
                  aria-label="Foto precedente"
                >
                  ‹
                </button>
                <button
                  onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-night hover:bg-white"
                  aria-label="Foto successiva"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${i === photoIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
            {photos[photoIdx].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-night/80 to-transparent px-4 pb-3 pt-8 text-sm font-semibold text-white">
                {photos[photoIdx].caption}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-night to-night-2 text-center text-sm text-slate-400">
            Nessuna foto caricata
          </div>
        )}
        {item.confirmed && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-verified">
            <VerifiedSeal size={13} /> Confermato
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="font-bold text-night">{item.title}</div>
        <div className="mt-0.5 text-xs text-muted">
          {item.client_name}
          {item.city ? ` · ${item.city}` : ''}
          {item.year ? ` · ${item.year}` : ''}
        </div>
        {item.description && <p className="mt-2 text-sm text-ink">{item.description}</p>}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-5 border-t border-line pt-3">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm font-bold transition ${liked ? 'text-orange' : 'text-muted hover:text-night'}`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z" strokeLinejoin="round" />
            </svg>
            {likeCount}
          </button>
          <button
            onClick={openComments}
            className="flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-night"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5h16v11H8l-4 3V5z" strokeLinejoin="round" /></svg>
            {commentCount}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            {comments.length === 0 ? (
              <p className="text-xs text-muted">Ancora nessun commento. Scrivi il primo.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="text-sm">
                  <span className="font-bold text-night">{c.author_name}</span>{' '}
                  <span className="text-ink">{c.body}</span>
                  {c.author_role === 'company' && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-verified">
                      <VerifiedSeal size={10} /> azienda
                    </span>
                  )}
                </div>
              ))
            )}
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                placeholder="Aggiungi un commento…"
                className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-orange focus:outline-none"
              />
              <button
                onClick={sendComment}
                disabled={!draft.trim()}
                className="rounded-lg bg-night px-4 text-sm font-bold text-white disabled:opacity-40"
              >
                Invia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
