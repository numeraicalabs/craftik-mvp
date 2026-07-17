'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/Brand';
import { Button, ErrorBanner, Field, Input, Select } from '@/components/ui';
import { CITY_NAMES } from '@/lib/utils';

export default function RegisterCompanyPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [legalName, setLegalName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [city, setCity] = useState('Milano');
  const [employeeCount, setEmployeeCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tok = await api.auth.registerCompany({
        email,
        password,
        legal_name: legalName,
        vat_number: vatNumber,
        city,
        employee_count: employeeCount,
      });
      setAuth(tok.access_token, tok.user_id, tok.role);
      router.push('/dashboard/company');
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
            Trova chi ti serve,
            <br />
            in giorni non in mesi.
          </h1>
          <p className="mt-2 text-sm text-muted">Crea l&apos;account della tua azienda.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorBanner message={error} />
            <Field label="Ragione sociale" htmlFor="legalName">
              <Input
                id="legalName"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Es. Edilcostruzioni SpA"
              />
            </Field>
            <Field label="P. IVA" htmlFor="vat" hint="Verrà verificata (in v2 via registro imprese).">
              <Input
                id="vat"
                required
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="IT01234567890"
              />
            </Field>
            <Field label="Email di contatto HR" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Password" htmlFor="password" hint="Almeno 8 caratteri.">
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Sede" htmlFor="city">
                <Select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITY_NAMES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Dipendenti" htmlFor="employees">
                <Input
                  id="employees"
                  type="number"
                  min={1}
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value))}
                />
              </Field>
            </div>
            <Button type="submit" fullWidth loading={loading}>
              Crea l&apos;account azienda
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
