import type { NextApiRequest } from 'next';
import type { SearchParams } from './types';

// クエリパラメータを安全に文字列化
// 配列の場合は最初の要素を採用、undefinedの場合は空文字列
function normalizeQueryParam(value: string | string[] | undefined): string {
  if (value === undefined) return '';
  if (Array.isArray(value)) return value[0] || '';
  return value;
}

// Next.jsのreq.queryを正規化してSearchParamsに変換
export function parseSearchParams(query: NextApiRequest['query']): SearchParams {
  const priceChangedOnlyStr = normalizeQueryParam(query.priceChangedOnly);

  return {
    q: normalizeQueryParam(query.q),
    maker: normalizeQueryParam(query.maker),
    region: normalizeQueryParam(query.region),
    pref: normalizeQueryParam(query.pref),
    city: normalizeQueryParam(query.city),
    minMan: normalizeQueryParam(query.minMan),
    maxMan: normalizeQueryParam(query.maxMan),
    priceChangedOnly: priceChangedOnlyStr === 'true',
  };
}
