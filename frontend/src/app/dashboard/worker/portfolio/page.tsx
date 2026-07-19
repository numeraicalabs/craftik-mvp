'use client';

import { useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import type { Certification, CertificationKind, PortfolioItemFull, WorkerProfile } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuth } from '@/lib/auth';
import { DashboardShell } from '@/components/DashboardShell';
import { CertList } from '@/components/Trust';
import { PhotoUploader } from '@/components/PhotoUploader';
import { VerifiedSeal } from '@/components/Brand';
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
  const [items, setItems] = useState<PortfolioItemFull[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [city, setCity] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [weeks, setWeeks] = useState(4);
  const [saving, setSaving] = useState(false);

  const [certName, setCertName] = useState('');
  const [certKind, setCertKind] = useState<CertificationKind>('patentino');
  const [certIssuer, setCertIssuer] = useState('');

  function reload(workerId: number, t: string) {
    api.portfolio.listFull(workerId, t).then(setItems).catch(console.error);
  }

  useEffect(() => {
    if (!ready || !token) return;
    api.workers.getMe(token).then((p) => {
      setMe(p);
      reload(p.id, token);
      api.certifications.listForWorker(p.id, token).then(setCerts).catch(console.error);
    }).catch(console.error);
  }, [ready, token]);

  async function addItem() {
    if (!token || !me) return;
    setError(null);
    setSaving(true);
    try {
      await api.portfolio.add(
        {
          title, description: description || null, role: null, client_name: clientName || null,
          city: city || null, year, duration_weeks: weeks, materials: null, company_id: null,
        },
        token,
      );
      reload(me.id, token);
      setShowForm(false);
      setTitle(''); setDescription(''); setClientName(''); setCity('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: number) {
    if (!token || !me) return;
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
            Aggiungi foto come prova. I lavori confermati dalle aziende pesano sul tuo score.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Chiudi' : '+ Aggiungi lavoro'}</Button>
      </div>

      <ErrorBanner message={error} />

      {showForm && (
        <Card className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titolo del lavoro">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Impianto elettrico villa" />
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
            <Button onClick={addItem} loading={saving} disabled={title.length < 3}>Salva lavoro</Button>
            <p className="mt-2 text-xs text-muted">Dopo aver salvato potrai aggiungere le foto.</p>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><p className="text-sm text-muted">Il portfolio è vuoto. Aggiungi il tuo primo lavoro.</p></Card>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <WorkItemManager key={it.id} item={it} token={token!} onDelete={deleteItem} onPhotosChanged={() => reload(me.id, token!)} />
          ))}
        </div>
      )}

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
            <Button onClick={addCert} fullWidth disabled={certName.length < 2}>Aggiungi e verifica</Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function WorkItemManager({
  item,
  token,
  onDelete,
  onPhotosChanged,
}: {
  item: PortfolioItemFull;
  token: string;
  onDelete: (id: number) => void;
  onPhotosChanged: () => void;
}) {
  const [photos, setPhotos] = useState(item.photos);

  async function upload(dataUrl: string) {
    const p = await api.portfolio.addPhoto(item.id, dataUrl, null, token);
    setPhotos((xs) => [...xs, p]);
    onPhotosChanged();
  }

  async function removePhoto(id: number) {
    await api.portfolio.deletePhoto(id, token).catch(console.error);
    setPhotos((xs) => xs.filter((x) => x.id !== id));
    onPhotosChanged();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-night">
            {item.title}
            {item.confirmed && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-verified">
                <VerifiedSeal size={13} /> Confermato
              </span>
            )}
          </div>
          <div className="text-xs text-muted">
            {item.client_name}{item.city ? ` · ${item.city}` : ''}{item.year ? ` · ${item.year}` : ''}
          </div>
        </div>
        <button onClick={() => onDelete(item.id)} className="text-xs font-semibold text-muted hover:text-red-600">
          Elimina lavoro
        </button>
      </div>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-concrete">
              <img src={p.data_url} alt={p.caption ?? ''} className="h-full w-full object-cover" />
              <button
                onClick={() => removePhoto(p.id)}
                className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-red-600 opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <PhotoUploader onUpload={upload} disabled={photos.length >= 8} />
        {photos.length >= 8 && <p className="mt-1 text-xs text-muted">Massimo 8 foto per lavoro.</p>}
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs text-muted">
        <span>❤ {item.like_count} mi piace</span>
        <span>💬 {item.comment_count} commenti</span>
      </div>
    </Card>
  );
}
