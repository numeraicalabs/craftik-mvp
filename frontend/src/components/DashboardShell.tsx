'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { Logo } from './Brand';

interface NavItem {
  href: string;
  label: string;
}

interface DashboardShellProps {
  role: 'worker' | 'company';
  nav: NavItem[];
  children: ReactNode;
}

function iconFor(label: string) {
  const l = label.toLowerCase();
  const cls = 'h-5 w-5 flex-none';
  if (l.includes('dashboard') || l.includes('offert'))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" /></svg>
    );
  if (l.includes('portfolio'))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" /></svg>
    );
  if (l.includes('candidature') || l.includes('cerca'))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    );
  if (l.includes('messagg'))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H8l-4 3V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
    );
  if (l.includes('profilo'))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    );
  if (l.includes('nuova') || l.includes('offerta'))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    );
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /></svg>
  );
}

export function DashboardShell({ role, nav, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push('/');
  }

  const homeHref = role === 'worker' ? '/dashboard/worker' : '/dashboard/company';

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo linkTo={homeHref} />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => {
          const active =
            pathname === n.href || (n.href !== homeHref && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-orange text-white shadow-cta'
                  : 'text-slate-300 hover:bg-night-2 hover:text-white'
              }`}
            >
              {iconFor(n.label)}
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {role === 'worker' ? 'Professionista' : 'Azienda'}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-night-2 hover:text-white"
        >
          <svg className="h-5 w-5 flex-none" viewBox="0 0 24 24" fill="none"><path d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Esci
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-concrete">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-night text-white lg:block">
        {SidebarInner}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Apri menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-night hover:bg-concrete"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <Logo linkTo={homeHref} />
        <div className="w-10" />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-night/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-night text-white shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Chiudi menu"
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-night-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            {SidebarInner}
          </aside>
        </div>
      )}

      <main className="px-5 py-6 lg:ml-64 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
