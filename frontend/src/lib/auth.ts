'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole } from './types';

interface AuthState {
  token: string | null;
  userId: number | null;
  role: UserRole | null;
  setAuth: (token: string, userId: number, role: UserRole) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      role: null,
      setAuth: (token, userId, role) => set({ token, userId, role }),
      logout: () => set({ token: null, userId: null, role: null }),
    }),
    {
      name: 'craftik-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
