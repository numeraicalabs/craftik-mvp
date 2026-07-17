import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Craftik — Where skills become opportunities',
  description:
    "L'infrastruttura di fiducia per i professionisti che costruiscono e mantengono l'Europa. Trova lavoratori verificati o mostra il tuo portfolio di cantieri.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
