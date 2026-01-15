import type { NextApiRequest } from 'next';
import type { SearchParams } from './types';
import type { SearchQuery, SearchSort } from './searchClient';

// クエリパラメータを安全に文字列化
// 配列の場合は最初の要素を採用、undefinedの場合は空文字列
function normalizeQueryParam(value: string | string[] | undefined): string {
  if (value === undefined) return '';
  if (Array.isArray(value)) return value[0] || '';
  return value;
}

function normalizeOptionalSlug(value: string | string[] | undefined): string | undefined {
  const v = normalizeQueryParam(value).trim().toLowerCase();
  return v ? v : undefined;
}

function normalizeOptionalNumber(value: string | string[] | undefined): number | undefined {
  const raw = normalizeQueryParam(value).trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  const n = Math.floor(parsed);
  return n > 0 ? n : undefined;
}

function normalizeOptionalSort(value: string | string[] | undefined): SearchSort | undefined {
  const v = normalizeQueryParam(value).trim();
  if (!v) return undefined;
  const allowed: readonly SearchSort[] = ['updated_desc', 'price_asc', 'price_desc', 'live'];
  return (allowed as readonly string[]).includes(v) ? (v as SearchSort) : undefined;
}

/**
 * Next.js API query -> SearchQuery (server-side unified input)
 */
export function parseSearchQuery(query: NextApiRequest['query']): SearchQuery {
  const priceChangedOnlyStr = normalizeQueryParam(query.priceChangedOnly).trim().toLowerCase();
  const priceChangedOnly = priceChangedOnlyStr === 'true' || priceChangedOnlyStr === '1';

  return {
    q: normalizeQueryParam(query.q).trim() || undefined,
    makerSlug: normalizeOptionalSlug(query.maker),
    modelSlug: normalizeOptionalSlug(query.model),
    prefSlug: normalizeOptionalSlug(query.pref),
    citySlug: normalizeOptionalSlug(query.city),
    featureSlug: normalizeOptionalSlug(query.feature),
    minMan: normalizeQueryParam(query.minMan).trim() || undefined,
    maxMan: normalizeQueryParam(query.maxMan).trim() || undefined,
    priceChangedOnly,
    page: normalizeOptionalNumber(query.page),
    pageSize: normalizeOptionalNumber(query.pageSize),
    sort: normalizeOptionalSort(query.sort),
  };
}

// Next.jsのreq.queryを正規化してSearchParamsに変換
export function parseSearchParams(query: NextApiRequest['query']): SearchParams {
  const priceChangedOnlyStr = normalizeQueryParam(query.priceChangedOnly);
  const makerSlug = normalizeQueryParam(query.maker);
  const modelSlug = normalizeQueryParam(query.model);
  const prefSlug = normalizeQueryParam(query.pref);
  const citySlug = normalizeQueryParam(query.city);
  const featureSlug = normalizeQueryParam(query.feature);

  return {
    q: normalizeQueryParam(query.q),
    // URLは日本語を含めない方針のため、maker/pref/cityはslugとして受け取る
    maker: '',
    pref: '',
    city: '',
    minMan: normalizeQueryParam(query.minMan),
    maxMan: normalizeQueryParam(query.maxMan),
    priceChangedOnly: priceChangedOnlyStr === 'true',

    featureSlug: featureSlug || undefined,
    makerSlug: makerSlug || undefined,
    modelSlug: modelSlug || undefined,
    prefSlug: prefSlug || undefined,
    citySlug: citySlug || undefined,
  };
}
