'use client';

import { useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api';
import type { AvailabilityStatus, WorkerProfile } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { DashboardShell } from '@/components/DashboardShell';
import { Button, Card, ErrorBanner, Field, Input, Select, Textarea } from '@/components/ui';
import { CITY_COORDS, CITY_NAMES } from '@/lib/utils';

const NAV = [
  { href: '/dashboard/worker', label: 'Dashboard' },
  { href: '/dashboard/worker/portfolio', label: 'Portfolio' },
  { href: '/dashboard/worker/applications', label: 'Candidature' },
  { href: '/dashboard/messages', label: 'Messaggi' },
  { href: '/dashboard/worker/profile', label: 'Profilo' },
];

export default function WorkerProfileEditPage() {
  const { token, ready } = useRequireAuth('worker');
  const [me, setMe] = useState<WorkerProfile | null>(null);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('Milano');
  const [radius, setRadius] = useState(25);
  const [relocate, setRelocate] = useState(false);
  const [rateMin, setRateMin] = useState(25);
  const [rateMax, setRateMax] = useState(40);
  const [availability, setAvailability] = useState<AvailabilityStatus>('within_week');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ready || !token) return;
    api.workers.getMe(token).then((p) => {
      setMe(p);
      setBio(p.bio ?? '');
      setCity(p.city);
      setRadius(p.travel_radius_km);
      setRelocate(p.willing_to_relocate);
      setRateMin(p.hourly_rate_min);
      setRateMax(p.hourly_rate_max);
      setAvailability(p.availability);
    }).catch(console.error);
  }, [ready, token]);

  async function save() {
    if (!token) return;
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const coords = CITY_COORDS[city] ?? CITY_COORDS.Milano;
      const updated = await api.workers.updateMe(
        {
          bio, city, latitude: coords.lat, longitude: coords.lng,
          travel_radius_km: radius, willing_to_relocate: relocate,
          hourly_rate_min: rateMin, hourly_rate_max: rateMax, availability,
        },
        token,
      );
      setMe(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    } finally {
      setSaving(false);
    }
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
      <h1 className="mb-6 font-display text-2xl font-black text-night">Modifica il tuo profilo</h1>
      <div className="max-w-2xl">
        <Card>
          <div className="space-y-5">
            <ErrorBanner message={error} />
            {saved && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                ✓ Profilo aggiornato. Lo score si ricalcola automaticamente.
              </div>
            )}
            <Field label="Bio professionale" hint="Racconta cosa sai fare: la vedono le aziende in ricerca.">
              <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Città">
                <Select value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITY_NAMES.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Disponibilità">
                <Select value={availability} onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}>
                  <option value="immediate">Immediata</option>
                  <option value="within_week">Entro una settimana</option>
                  <option value="within_month">Entro un mese</option>
                  <option value="not_looking">Non in cerca</option>
                </Select>
              </Field>
            </div>
            <Field label={`Raggio di trasferta: ${radius} km`}>
              <input
                type="range" min={5} max={200} step={5} value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-orange"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox" checked={relocate}
                onChange={(e) => setRelocate(e.target.checked)}
                className="h-4 w-4 accent-orange"
              />
              Disponibile a trasferte in tutta Europa
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tariffa minima (€/h)">
                <Input type="number" min={5} value={rateMin} onChange={(e) => setRateMin(Number(e.target.value))} />
              </Field>
              <Field label="Tariffa massima (€/h)">
                <Input type="number" min={5} value={rateMax} onChange={(e) => setRateMax(Number(e.target.value))} />
              </Field>
            </div>
            <Button onClick={save} loading={saving} fullWidth>
              Salva modifiche
            </Button>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
