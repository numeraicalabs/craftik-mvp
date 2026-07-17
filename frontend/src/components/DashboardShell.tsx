'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

import { useAuth } from '@/lib/auth';
import { Logo } from './Brand';

interface DashboardShellProps {
  role: 'worker' | 'company';
  nav: { href: string; label: string }[];
  children: ReactNode;
}

export function DashboardShell({ role, nav, children }: DashboardShellProps) {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-concrete">
      <nav className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Logo linkTo={role === 'worker' ? '/dashboard/worker' : '/dashboard/company'} />
            <div className="hidden gap-6 md:flex">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-sm font-semibold text-muted hover:text-night"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-muted sm:inline">
              {role === 'worker' ? 'Professionista' : 'Azienda'}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-muted hover:text-night"
            >
              Esci
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
