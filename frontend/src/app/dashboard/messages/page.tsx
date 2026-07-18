'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ChatMessage, Conversation } from '@/lib/types';
import { DashboardShell } from '@/components/DashboardShell';
import { Button, Input } from '@/components/ui';

const POLL_MS = 5000;

export default function MessagesPage() {
  const { token, userId, role } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!token) return;
    api.messages.conversations(token).then((cs) => {
      setConvs(cs);
      if (cs.length > 0) setActive((a) => a ?? cs[0]);
    }).catch(console.error);
  }, [token]);

  // Load + poll messages of active conversation
  const fetchNew = useCallback(async () => {
    if (!token || !active) return;
    try {
      const news = await api.messages.list(active.id, lastIdRef.current, token);
      if (news.length > 0) {
        lastIdRef.current = news[news.length - 1].id;
        setMessages((m) => [...m, ...news]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, active]);

  useEffect(() => {
    // reset when switching conversation
    setMessages([]);
    lastIdRef.current = 0;
    if (!active) return;
    fetchNew();
    const t = setInterval(fetchNew, POLL_MS);
    return () => clearInterval(t);
  }, [active, fetchNew]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    if (!token || !active || !draft.trim()) return;
    const body = draft.trim();
    setDraft('');
    try {
      const msg = await api.messages.send(active.id, body, token);
      lastIdRef.current = msg.id;
      setMessages((m) => [...m, msg]);
    } catch (e) {
      console.error(e);
      setDraft(body); // restore on failure
    }
  }

  const nav =
    role === 'company'
      ? [
          { href: '/dashboard/company', label: 'Le mie offerte' },
          { href: '/dashboard/company/search', label: 'Cerca professionisti' },
          { href: '/dashboard/messages', label: 'Messaggi' },
        ]
      : [
          { href: '/dashboard/worker', label: 'Dashboard' },
          { href: '/dashboard/worker/applications', label: 'Le mie candidature' },
          { href: '/dashboard/messages', label: 'Messaggi' },
        ];

  return (
    <DashboardShell role={role === 'company' ? 'company' : 'worker'} nav={nav}>
      <h1 className="mb-6 font-display text-2xl font-black text-night">Messaggi</h1>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className="space-y-2">
          {convs.length === 0 && (
            <div className="rounded-xl border border-line bg-white p-5 text-sm text-muted">
              Nessuna conversazione. {role === 'company'
                ? 'Apri il profilo di un professionista e clicca "Contatta".'
                : 'Le aziende interessate al tuo profilo ti scriveranno qui.'}
            </div>
          )}
          {convs.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className={`block w-full rounded-xl border p-3 text-left transition ${
                active?.id === c.id ? 'border-orange bg-orange-soft' : 'border-line bg-white hover:border-night'
              }`}
            >
              <div className="text-sm font-bold text-night">{c.other_name}</div>
              <div className="truncate text-xs text-muted">
                {c.last_message_preview ?? 'Nuova conversazione'}
              </div>
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="flex h-[560px] flex-col rounded-2xl border border-line bg-white">
          {active ? (
            <>
              <div className="border-b border-line px-5 py-3 font-bold text-night">
                {active.other_name}
                <span className="ml-2 text-xs font-semibold uppercase tracking-widest text-muted">
                  {active.other_role === 'company' ? 'Azienda' : 'Professionista'}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => {
                  const mine = m.sender_user_id === userId;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          mine ? 'bg-night text-white' : 'bg-concrete text-ink'
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="flex gap-2 border-t border-line p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Scrivi un messaggio…"
                />
                <Button onClick={send} className="!px-4">
                  Invia
                </Button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-muted">
              Seleziona una conversazione
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
