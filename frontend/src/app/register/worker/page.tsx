'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/Brand';
import { Button, ErrorBanner, Field, Input, Select } from '@/components/ui';
import { PROFESSIONS, type Profession } from '@/lib/types';
import { CITY_COORDS, CITY_NAMES } from '@/lib/utils';

export default function RegisterWorkerPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profession, setProfession] = useState<Profession>('elettricista');
  const [city, setCity] = useState('Milano');
  const [yearsExperience, setYearsExperience] = useState(5);
  const [travelRadius, setTravelRadius] = useState(25);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const coords = CITY_COORDS[city] ?? CITY_COORDS.Milano;
      const tok = await api.auth.registerWorker({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        profession,
        city,
        latitude: coords.lat,
        longitude: coords.lng,
        years_experience: yearsExperience,
        travel_radius_km: travelRadius,
      });
      setAuth(tok.access_token, tok.user_id, tok.role);
      router.push('/dashboard/worker');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-concrete">
      <div className="mx-auto max-w-lg px-6 py-14">
        <div className="mb-8 text-center">
          <div className="inline-block">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-3xl font-black tracking-tight text-night">
            Il tuo mestiere,
            <br />
            la tua reputazione.
          </h1>
          <p className="mt-2 text-sm text-muted">
            Crea il tuo profilo professionale in meno di 5 minuti.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorBanner message={error} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome" htmlFor="firstName">
                <Input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Cognome" htmlFor="lastName">
                <Input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tu@esempio.com"
              />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              hint="Almeno 8 caratteri."
            >
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Il tuo mestiere" htmlFor="profession">
              <Select
                id="profession"
                required
                value={profession}
                onChange={(e) => setProfession(e.target.value as Profession)}
              >
                {PROFESSIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.icon} {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Città" htmlFor="city">
                <Select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITY_NAMES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Anni di esperienza" htmlFor="years">
                <Input
                  id="years"
                  type="number"
                  min={0}
                  max={70}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label={`Raggio di trasferta: ${travelRadius} km`} htmlFor="radius">
              <input
                id="radius"
                type="range"
                min={5}
                max={200}
                step={5}
                value={travelRadius}
                onChange={(e) => setTravelRadius(Number(e.target.value))}
                className="w-full accent-orange"
              />
            </Field>
            <Button type="submit" fullWidth loading={loading}>
              Crea il profilo
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-6 text-center text-sm text-muted">
            Hai già un account?{' '}
            <Link href="/login" className="font-semibold text-orange-dark hover:underline">
              Accedi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
