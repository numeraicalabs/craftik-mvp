'use client';

import { useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import type { Certification, CertificationKind, PortfolioItem, WorkerProfile } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { CertList, PortfolioCard } from '@/components/Trust';
import { Button, Card, ErrorBanner, Field, Input, Select, Textarea } from '@/components/ui';

const NAV = [
  { href: '/dashboard/worker', label: 'Dashboard' },
  { href: '/dashboard/worker/portfolio', label: 'Portfolio' },
  { href: '/dashboard/worker/applications', label: 'Candidature' },
  { href: '/dashboard/messages', label: 'Messaggi' },
  { href: '/dashboard/worker/profile', label: 'Profilo' },
];

export default function WorkerPortfolioPage() {
  const { token, ready } = useRequireAuth('worker');
  const [me, setMe] = useState<WorkerProfile | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Portfolio form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [city, setCity] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [weeks, setWeeks] = useState(4);
  const [saving, setSaving] = useState(false);

  // Cert form
  const [certName, setCertName] = useState('');
  const [certKind, setCertKind] = useState<CertificationKind>('patentino');
  const [certIssuer, setCertIssuer] = useState('');

  useEffect(() => {
    if (!ready || !token) return;
    api.workers.getMe(token).then((p) => {
      setMe(p);
      api.portfolio.listForWorker(p.id, token).then(setItems).catch(console.error);
      api.certifications.listForWorker(p.id, token).then(setCerts).catch(console.error);
    }).catch(console.error);
  }, [ready, token]);

  async function addItem() {
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      const item = await api.portfolio.add(
        {
          title, description: description || null, role: null, client_name: clientName || null,
          city: city || null, year, duration_weeks: weeks, materials: null, company_id: null,
        },
        token,
      );
      setItems((xs) => [item, ...xs]);
      setShowForm(false);
      setTitle(''); setDescription(''); setClientName(''); setCity('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: number) {
    if (!token) return;
    await api.portfolio.remove(id, token).catch(console.error);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }

  async function addCert() {
    if (!token || !certName) return;
    try {
      const c = await api.certifications.add(
        { kind: certKind, name: certName, issuer: certIssuer || null, issued_year: null, expires_year: null },
        token,
      );
      setCerts((xs) => [...xs, c]);
      setCertName(''); setCertIssuer('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    }
  }

  async function deleteCert(id: number) {
    if (!token) return;
    await api.certifications.remove(id, token).catch(console.error);
    setCerts((xs) => xs.filter((x) => x.id !== id));
  }

  if (!ready || !me) {
    return (
      <DashboardShell role="worker" nav={NAV}>
        <div className="text-muted">Caricamento…</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="worker" nav={NAV}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-night">Il mio portfolio</h1>
          <p className="text-sm text-muted">
            Ogni lavoro documentato è una prova. I lavori confermati dalle aziende pesano sul tuo score.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Chiudi' : '+ Aggiungi lavoro'}</Button>
      </div>

      <ErrorBanner message={error} />

      {showForm && (
        <Card className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titolo del lavoro">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Impianto elettrico villa bifamiliare" />
            </Field>
            <Field label="Cliente / azienda">
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Es. Cliente privato" />
            </Field>
            <Field label="Città">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Anno">
                <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </Field>
              <Field label="Durata (settimane)">
                <Input type="number" min={1} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Descrizione">
                <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={addItem} loading={saving} disabled={title.length < 3}>
              Salva nel portfolio
            </Button>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Il portfolio è vuoto. Aggiungi il tuo primo lavoro documentato.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <PortfolioCard key={it.id} item={it} onDelete={deleteItem} />
          ))}
        </div>
      )}

      {/* Certifications */}
      <h2 className="mb-3 mt-10 font-display text-xl font-black text-night">Certificazioni e patentini</h2>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <CertList certs={certs} onDelete={deleteCert} />
        <Card>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted">Aggiungi</h3>
          <div className="space-y-3">
            <Field label="Tipo">
              <Select value={certKind} onChange={(e) => setCertKind(e.target.value as CertificationKind)}>
                <option value="patentino">Patentino</option>
                <option value="certificazione">Certificazione</option>
                <option value="patente">Patente</option>
              </Select>
            </Field>
            <Field label="Nome">
              <Input value={certName} onChange={(e) => setCertName(e.target.value)} placeholder="Es. Gru a torre" />
            </Field>
            <Field label="Ente (opzionale)">
              <Input value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} />
            </Field>
            <Button onClick={addCert} fullWidth disabled={certName.length < 2}>
              Aggiungi e verifica
            </Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
