// Milano coordinates as default center for geo-first search UX.
export const DEFAULT_CENTER = { lat: 45.4642, lng: 9.19, city: 'Milano' };

// Simple city → lat/lng lookup for MVP UX. In v2: geocoder (Mapbox/Google).
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Milano: { lat: 45.4642, lng: 9.19 },
  Bergamo: { lat: 45.6983, lng: 9.6773 },
  Brescia: { lat: 45.5416, lng: 10.2118 },
  Bologna: { lat: 44.4949, lng: 11.3426 },
  Torino: { lat: 45.0703, lng: 7.6869 },
  Verona: { lat: 45.4384, lng: 10.9916 },
  Padova: { lat: 45.4064, lng: 11.8768 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  Napoli: { lat: 40.8518, lng: 14.2681 },
  Firenze: { lat: 43.7696, lng: 11.2558 },
  Genova: { lat: 44.4056, lng: 8.9463 },
  Palermo: { lat: 38.1157, lng: 13.3615 },
  Varsavia: { lat: 52.2297, lng: 21.0122 },
};

export const CITY_NAMES = Object.keys(CITY_COORDS);

export function initials(first: string, last: string): string {
  return (first[0] ?? '').toUpperCase() + (last[0] ?? '').toUpperCase();
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('it-IT').format(n);
}

// Deterministic gradient for avatars — same worker always gets the same colors.
export function avatarGradient(id: number): string {
  const palette = [
    'from-orange to-orange-light',
    'from-night to-night-2',
    'from-verified to-emerald-300',
    'from-signal to-orange',
    'from-purple-600 to-pink-500',
    'from-cyan-500 to-blue-600',
  ];
  return palette[id % palette.length];
}
