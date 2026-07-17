'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/Brand';
import { Button, ErrorBanner, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tok = await api.auth.loginJson(email, password);
      setAuth(tok.access_token, tok.user_id, tok.role);
      router.push(tok.role === 'worker' ? '/dashboard/worker' : '/dashboard/company');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Errore inatteso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-concrete">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="mb-10 text-center">
          <div className="inline-block">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-3xl font-black tracking-tight text-night">
            Bentornato
          </h1>
          <p className="mt-2 text-sm text-muted">Accedi al tuo account Craftik.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <ErrorBanner message={error} />
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
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" fullWidth loading={loading}>
              Accedi
            </Button>
          </form>

          <div className="mt-6 border-t border-line pt-6 text-center text-sm text-muted">
            Non hai un account?{' '}
            <Link href="/register/worker" className="font-semibold text-orange-dark hover:underline">
              Registrati come professionista
            </Link>
            {' o '}
            <Link href="/register/company" className="font-semibold text-orange-dark hover:underline">
              come azienda
            </Link>
            .
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-white/50 p-4 text-xs text-muted">
          <div className="mb-1 font-semibold text-night">Credenziali demo:</div>
          <div>Lavoratore: <code>marco@craftik.dev</code> / <code>demo1234</code></div>
          <div>Azienda: <code>hr@edilcostruzioni.dev</code> / <code>demo1234</code></div>
        </div>
      </div>
    </div>
  );
}
