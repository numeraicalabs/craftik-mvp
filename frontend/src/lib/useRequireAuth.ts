'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

/** Client-side guard: redirects to /login if unauthenticated, or to the correct
 * dashboard if the role doesn't match. Returns ready=true once safe to render.
 *
 * We keep this client-side for MVP simplicity. In production we'd add SSR
 * checks with httpOnly cookies + middleware.ts.
 */
export function useRequireAuth(requiredRole: UserRole): { token: string | null; ready: boolean } {
  const router = useRouter();
  const { token, role } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // On first render Zustand may not have hydrated from localStorage yet.
    // Wait a tick to avoid a false-negative redirect flash.
    const t = setTimeout(() => {
      if (!token) {
        router.replace('/login');
        return;
      }
      if (role && role !== requiredRole) {
        router.replace(role === 'worker' ? '/dashboard/worker' : '/dashboard/company');
        return;
      }
      setReady(true);
    }, 60);
    return () => clearTimeout(t);
  }, [token, role, requiredRole, router]);

  return { token, ready };
}
