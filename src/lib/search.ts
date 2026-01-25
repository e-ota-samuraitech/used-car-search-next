/**
 * 検索インターフェイスラッパー
 * SEOライブラリとの統合用
 */

import type { Car } from '@/types';
import type { ParsedUrl } from './seo/types';
import type { SearchQuery, SearchSort, Facet } from '@/server/search/searchClient';

function normalizeSort(value: string | undefined): SearchSort | undefined {
  if (!value) return undefined;
  switch (value) {
    case 'updated_desc':
    case 'price_asc':
    case 'price_desc':
    case 'live':
      return value;
    default:
      return undefined;
  }
}

// ============================================
// 検索パラメータ（SEO用）
// ============================================

/**
 * SEO評価用の検索パラメータ
 * ParsedUrlから検索パラメータへ変換する
 */
export interface SeoSearchParams {
  /** キーワード検索 */
  q?: string;

  /** feature slug */
  featureSlug?: string;

  /** 最小価格（万円） */
  minMan?: string;

  /** 最大価格（万円） */
  maxMan?: string;

  /** ページネーション */
  page?: number;

  /** ソート */
  sort?: string;

  // slug ベースの検索（URLから抽出される）
  makerSlug?: string;
  modelSlug?: string;
  prefSlug?: string;
  citySlug?: string;
}

/**
 * 検索結果
 */
export interface SearchResult {
  /** 検索結果の車両一覧 */
  items: Car[];

  /** 総件数 */
  totalCount: number;

  /** 実際に返却した件数 */
  count: number;

  /** 検索に使用したパラメータ */
  params: SeoSearchParams;

  /** ファセット（絞り込み候補） */
  facets: Facet[];
}

// ============================================
// ParsedUrlから検索パラメータへの変換
// ============================================

/**
 * ParsedUrlから検索パラメータを生成
 */
export function parsedUrlToSearchParams(parsed: ParsedUrl): SeoSearchParams {
  const params: SeoSearchParams = {};

  // 都道府県（slugのみ）
  if (parsed.prefSlug) {
    params.prefSlug = parsed.prefSlug;
  }

  // 市区町村（slugのみ）
  if (parsed.citySlug) {
    params.citySlug = parsed.citySlug;
  }

  // メーカー（slugのみ）
  if (parsed.makerSlug) {
    params.makerSlug = parsed.makerSlug;
  }

  // 車種（slugのみ）
  if (parsed.modelSlug) {
    params.modelSlug = parsed.modelSlug;
  }

  // feature（slug）
  if (parsed.featureSlug) {
    params.featureSlug = parsed.featureSlug;
  }

  // フリーワード
  if (parsed.freewordKeyword) {
    params.q = parsed.freewordKeyword;
  }

  // クエリから追加パラメータを取得
  if (parsed.query) {
    if (parsed.query.q) {
      params.q = Array.isArray(parsed.query.q) ? parsed.query.q[0] : parsed.query.q;
    }
    if (parsed.query.keyword) {
      params.q = Array.isArray(parsed.query.keyword) ? parsed.query.keyword[0] : parsed.query.keyword;
    }
    if (parsed.query.minMan) {
      params.minMan = Array.isArray(parsed.query.minMan) ? parsed.query.minMan[0] : parsed.query.minMan;
    }
    if (parsed.query.maxMan) {
      params.maxMan = Array.isArray(parsed.query.maxMan) ? parsed.query.maxMan[0] : parsed.query.maxMan;
    }
    // Note: priceChangedOnly params are now ignored (feature removed)
  }

  // ページネーション・ソート
  if (parsed.page) {
    params.page = parsed.page;
  }
  if (parsed.sort) {
    params.sort = parsed.sort;
  }

  return params;
}

// ============================================
// 検索実行（サーバーサイド用）
// ============================================

/**
 * サーバーサイドで検索を実行（getServerSideProps内で使用）
 *
 * @param params 検索パラメータ
 * @returns 検索結果
 */
export async function executeSearch(params: SeoSearchParams): Promise<SearchResult> {
  // 既存の検索APIを呼び出す
  // 注意: getServerSideProps内ではfetchではなく、直接searchServiceを呼び出すことを推奨

  try {
    // 環境に応じてAPIエンドポイントを構築
    const isServer = typeof window === 'undefined';

    if (isServer) {
      // Server-side: always use the unified SearchClient (single source of truth for totalCount)
      const { getSearchClient } = await import('@/server/search/searchClient');
      const client = getSearchClient();

      const query: SearchQuery = {
        q: params.q,
        makerSlug: params.makerSlug,
        modelSlug: params.modelSlug,
        prefSlug: params.prefSlug,
        citySlug: params.citySlug,
        featureSlug: params.featureSlug,
        minMan: params.minMan,
        maxMan: params.maxMan,
        page: params.page,
        sort: normalizeSort(params.sort),
      };

      const result = await client.search(query);

      return {
        items: result.items,
        totalCount: result.totalCount,
        count: result.items.length,
        params,
        facets: result.facets ?? [],
      };
    } else {
      // クライアントサイドの場合、APIエンドポイントを呼び出す
      const queryParams = new URLSearchParams();

      if (params.q) queryParams.append('q', params.q);
      if (params.makerSlug) queryParams.append('maker', params.makerSlug);
      if (params.modelSlug) queryParams.append('model', params.modelSlug);
      if (params.prefSlug) queryParams.append('pref', params.prefSlug);
      if (params.citySlug) queryParams.append('city', params.citySlug);
      if (params.featureSlug) queryParams.append('feature', params.featureSlug);
      if (params.minMan) queryParams.append('minMan', params.minMan);
      if (params.maxMan) queryParams.append('maxMan', params.maxMan);
      if (typeof params.page === 'number') queryParams.append('page', String(params.page));
      const sort = normalizeSort(params.sort);
      if (sort) queryParams.append('sort', sort);

      const response = await fetch(`/api/search?${queryParams.toString()}`);

      const contentType = response.headers.get('content-type') || '';
      const looksJson = contentType.toLowerCase().includes('application/json');
      const looksIapBlocked =
        response.redirected ||
        response.status === 0 ||
        response.status === 302 ||
        response.status === 401 ||
        response.status === 403;

      if (!response.ok || !looksJson || looksIapBlocked) {
        let snippet = '';
        if (!looksJson) {
          try {
            const text = await response.text();
            snippet = text.replace(/\s+/g, ' ').trim();
            snippet = snippet.length > 200 ? `${snippet.slice(0, 197)}...` : snippet;
          } catch {
            // ignore
          }
        }

        console.warn('Search API returned non-JSON or auth redirect.', {
          ok: response.ok,
          status: response.status,
          redirected: response.redirected,
          url: response.url,
          contentType,
          snippet,
        });
        throw new Error('Search API returned non-JSON or requires auth');
      }

      const data: unknown = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Search API returned invalid JSON');
      }

      const record = data as Record<string, unknown>;
      const items = Array.isArray(record.items) ? (record.items as Car[]) : [];
      const totalCount = typeof record.totalCount === 'number' ? record.totalCount : NaN;

      if (!Number.isFinite(totalCount)) {
        throw new Error('Search API must return totalCount');
      }

      return {
        items,
        totalCount,
        count: items.length,
        params,
        facets: [], // API経由では facets は取得しない（SSR前提）
      };
    }
  } catch (error) {
    console.error('Search error:', error);
    return {
      items: [],
      totalCount: 0,
      count: 0,
      params,
      facets: [],
    };
  }
}

/**
 * ParsedUrlから直接検索を実行
 */
export async function executeSearchFromParsedUrl(parsed: ParsedUrl): Promise<SearchResult> {
  const params = parsedUrlToSearchParams(parsed);
  return executeSearch(params);
}
