import type { MakerSlug, Pathname, PrefSlug, QueryParams } from './types';
import { normalizeQueryParam } from './types';
import { toMakerSlug, toPrefSlug } from './slugMapping';

export interface CarsSeoParams {
  prefSlug: PrefSlug | null;
  makerSlug: MakerSlug | null;
}

function isTruthy(value: string): boolean {
  return value.trim().length > 0;
}

function parsePage(value: string): number | null {
  if (!isTruthy(value)) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
}

export function extractCarsSeoParamsFromQuery(query: QueryParams): CarsSeoParams {
  const prefName = normalizeQueryParam(query.pref);
  const makerName = normalizeQueryParam(query.maker);

  return {
    prefSlug: toPrefSlug(prefName),
    makerSlug: toMakerSlug(makerName),
  };
}

export function toCarsRoutingPathFromSeoParams(params: CarsSeoParams): Pathname | null {
  const { prefSlug, makerSlug } = params;

  if (prefSlug && makerSlug) {
    return `/cars/pref/${prefSlug}/maker/${makerSlug}/`;
  }
  if (prefSlug) {
    return `/cars/pref/${prefSlug}/`;
  }
  if (makerSlug) {
    return `/cars/maker/${makerSlug}/`;
  }
  return null;
}

// 「回送URLに完全変換できる」クエリか判定。
// - pref/maker 以外の条件が混ざる場合は false（canonical寄せで対応）
// - page は未指定 or 1 のみ許可（page>=2 はリダイレクトしない想定）
export function canRedirectToCarsRoutingUrl(query: QueryParams): boolean {
  const q = normalizeQueryParam(query.q);
  const region = normalizeQueryParam(query.region);
  const city = normalizeQueryParam(query.city);
  const minMan = normalizeQueryParam(query.minMan);
  const maxMan = normalizeQueryParam(query.maxMan);
  const priceChangedOnly = normalizeQueryParam(query.priceChangedOnly);
  const pageRaw = normalizeQueryParam(query.page);

  const page = parsePage(pageRaw);

  if (isTruthy(q)) return false;
  if (isTruthy(region)) return false;
  if (isTruthy(city)) return false;
  if (isTruthy(minMan)) return false;
  if (isTruthy(maxMan)) return false;
  if (priceChangedOnly === 'true') return false;
  if (page !== null && page !== 1) return false;

  const { prefSlug, makerSlug } = extractCarsSeoParamsFromQuery(query);
  return Boolean(prefSlug || makerSlug);
}

export function toCarsRedirectPathFromQuery(query: QueryParams): Pathname | null {
  if (!canRedirectToCarsRoutingUrl(query)) return null;
  const params = extractCarsSeoParamsFromQuery(query);
  return toCarsRoutingPathFromSeoParams(params);
}

// canonical は「最も近い回送URL」に寄せる（変換できない場合は null）
export function toCarsCanonicalPathFromQuery(query: QueryParams): Pathname | null {
  const params = extractCarsSeoParamsFromQuery(query);
  return toCarsRoutingPathFromSeoParams(params);
}
