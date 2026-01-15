export interface FreewordContext {
  lastFreewordQuery: string;
  sourceCarsKey: string;
}

const STORAGE_KEY = 'ucs_freeword_context_v1';

export function carsKeyFromCarsPath(pathname: string): string {
  // expects something like /cars/m-toyota/s-prius/
  const trimmed = pathname.split('?')[0].replace(/#.*$/, '');
  const normalized = trimmed.endsWith('/') ? trimmed : `${trimmed}/`;

  if (!normalized.startsWith('/cars/')) return '';

  const rest = normalized.slice('/cars/'.length);
  const segments = rest.split('/').filter(Boolean);
  return segments.join('/');
}

export function setFreewordContext(ctx: FreewordContext): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    // ignore
  }
}

export function getFreewordContext(): FreewordContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FreewordContext>;
    if (!parsed.lastFreewordQuery || !parsed.sourceCarsKey) return null;
    return {
      lastFreewordQuery: String(parsed.lastFreewordQuery),
      sourceCarsKey: String(parsed.sourceCarsKey),
    };
  } catch {
    return null;
  }
}

export function clearFreewordContext(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
