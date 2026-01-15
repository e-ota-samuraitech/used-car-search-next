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

  /** メーカー */
  maker?: string;

  /** 都道府県 */
  pref?: string;

  /** 市区町村 */
  city?: string;

  /** feature */
  feature?: string;

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
 * slug→日本語名マッピング（検索パラメータ用）
 */
const PREF_SLUG_TO_NAME: Record<string, string> = {
  tokyo: '東京都',
  kanagawa: '神奈川県',
  chiba: '千葉県',
  saitama: '埼玉県',
  osaka: '大阪府',
  hyogo: '兵庫県',
  kyoto: '京都府',
  aichi: '愛知県',
  shizuoka: '静岡県',
  fukuoka: '福岡県',
  kumamoto: '熊本県',
  miyagi: '宮城県',
};

const CITY_SLUG_TO_NAME: Record<string, string> = {
  yokohama: '横浜市',
  kawasaki: '川崎市',
  nagoya: '名古屋市',
};

const MAKER_SLUG_TO_NAME: Record<string, string> = {
  toyota: 'トヨタ',
  honda: 'ホンダ',
  nissan: '日産',
  suzuki: 'スズキ',
  mazda: 'マツダ',
  subaru: 'スバル',
  daihatsu: 'ダイハツ',
  mitsubishi: '三菱',
  lexus: 'レクサス',
  audi: 'アウディ',
  jeep: 'ジープ',
  volkswagen: 'フォルクスワーゲン',
  peugeot: 'プジョー',
  volvo: 'ボルボ',
  'mercedes-benz': 'メルセデス・ベンツ',
  bmw: 'BMW',
  mini: 'MINI',
};

/**
 * ParsedUrlから検索パラメータを生成
 */
export function parsedUrlToSearchParams(parsed: ParsedUrl): SeoSearchParams {
  const params: SeoSearchParams = {};

  // 都道府県（slugを直接渡す）
  if (parsed.prefSlug) {
    params.prefSlug = parsed.prefSlug;
    params.pref = PREF_SLUG_TO_NAME[parsed.prefSlug] || parsed.prefSlug;
  }

  // 市区町村（slugを直接渡す）
  if (parsed.citySlug) {
    params.citySlug = parsed.citySlug;
    params.city = CITY_SLUG_TO_NAME[parsed.citySlug] || parsed.citySlug;
  }

  // メーカー（slugを直接渡す）
  if (parsed.makerSlug) {
    params.makerSlug = parsed.makerSlug;
    params.maker = MAKER_SLUG_TO_NAME[parsed.makerSlug] || parsed.makerSlug;
  }

  // 車種（slugのみ）
  if (parsed.modelSlug) {
    params.modelSlug = parsed.modelSlug;
  }

  // feature（現状、既存検索APIはfeatureに対応していない想定。必要に応じて拡張）
  if (parsed.featureSlug) {
    params.feature = parsed.featureSlug;
    // featureを検索キーワードとして扱う（暫定）
    params.q = parsed.featureSlug;
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
        maker: params.maker || '',
        region: '', // 現状未対応
        pref: params.pref || '',
        city: params.city || '',
        minMan: params.minMan || '',
        maxMan: params.maxMan || '',
        priceChangedOnly: params.priceChangedOnly || false,
        makerSlug: params.makerSlug,
        modelSlug: params.modelSlug,
        prefSlug: params.prefSlug,
        citySlug: params.citySlug,
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
      if (params.maker) queryParams.append('maker', params.maker);
      if (params.pref) queryParams.append('pref', params.pref);
      if (params.city) queryParams.append('city', params.city);
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
