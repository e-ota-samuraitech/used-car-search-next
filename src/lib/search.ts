/**
 * 検索インターフェイスラッパー
 * SEOライブラリとの統合用
 */

import type { Car } from '@/types';
import type { ParsedUrl } from './seo/types';

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

  /** 価格変動のみ */
  priceChangedOnly?: boolean;

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

    const priceChangedOnlyRaw = parsed.query.priceChangedOnly;
    const priceChangedOnly = Array.isArray(priceChangedOnlyRaw) ? priceChangedOnlyRaw[0] : priceChangedOnlyRaw;
    if (priceChangedOnly === 'true') {
      params.priceChangedOnly = true;
    }
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
      // サーバーサイドの場合、直接searchServiceをインポートして使用
      // ここではfetchを使う例を示すが、実際には searchService を直接呼び出す方が効率的
      const { searchCars } = await import('@/server/search/searchService');
      const { MockCarDataSource } = await import('@/server/search/dataSource/mockDataSource');

      const searchParams = {
        q: params.q || '',
        maker: '',
        pref: '',
        city: '',
        minMan: params.minMan || '',
        maxMan: params.maxMan || '',
        priceChangedOnly: params.priceChangedOnly || false,
        makerSlug: params.makerSlug,
        modelSlug: params.modelSlug,
        prefSlug: params.prefSlug,
        citySlug: params.citySlug,
        featureSlug: params.featureSlug,
      };

      const dataSource = new MockCarDataSource();
      const results = searchCars(searchParams, dataSource);

      return {
        items: results,
        totalCount: results.length,
        count: results.length,
        params,
      };
    } else {
      // クライアントサイドの場合、APIエンドポイントを呼び出す
      const queryParams = new URLSearchParams();

      if (params.q) queryParams.append('q', params.q);
      if (params.makerSlug) queryParams.append('maker', params.makerSlug);
      if (params.prefSlug) queryParams.append('pref', params.prefSlug);
      if (params.citySlug) queryParams.append('city', params.citySlug);
      if (params.featureSlug) queryParams.append('feature', params.featureSlug);
      if (params.minMan) queryParams.append('minMan', params.minMan);
      if (params.maxMan) queryParams.append('maxMan', params.maxMan);
      if (params.priceChangedOnly) queryParams.append('priceChangedOnly', 'true');

      const response = await fetch(`/api/search?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Search API failed');
      }

      const data = await response.json();

      return {
        items: data.items || [],
        totalCount: data.items?.length || 0,
        count: data.items?.length || 0,
        params,
      };
    }
  } catch (error) {
    console.error('Search error:', error);
    return {
      items: [],
      totalCount: 0,
      count: 0,
      params,
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
