/**
 * SEOライブラリ - 型定義
 * 中古車検索サイト SEO仕様書 Ver.1.1 準拠
 */

// ============================================
// 基本型定義
// ============================================

export type AbsoluteUrl = `http://${string}` | `https://${string}`;
export type Pathname = `/${string}`;

export type IndexDirective = 'index' | 'noindex';
export type FollowDirective = 'follow' | 'nofollow';
export type RobotsMetaContent = `${IndexDirective},${FollowDirective}`;

// ============================================
// URL種別と接頭辞
// ============================================

/**
 * URL接頭辞（必須）
 * - p-: 都道府県 (prefecture)
 * - c-: 市区町村 (city)
 * - m-: メーカー (maker)
 * - s-: 車種 (model/series)
 * - f-: feature
 * - d-: 車両詳細 (detail)
 */
export type UrlPrefix = 'p-' | 'c-' | 'm-' | 's-' | 'f-' | 'd-';

/**
 * URL種別
 */
export type UrlType =
  | 'cars-top'           // /cars/
  | 'pref'               // /cars/p-{pref}/
  | 'city'               // /cars/p-{pref}/c-{city}/
  | 'maker'              // /cars/m-{maker}/
  | 'model'              // /cars/m-{maker}/s-{model}/
  | 'feature'            // /cars/f-{feature}/
  | 'pref-feature'       // /cars/p-{pref}/f-{feature}/
  | 'pref-maker'         // /cars/p-{pref}/m-{maker}/
  | 'city-maker'         // /cars/p-{pref}/c-{city}/m-{maker}/
  | 'detail'             // /cars/d-{id}/
  | 'freeword'           // /results/freeword/{keyword}/index.html
  | 'query-search'       // その他クエリ検索
  | 'unknown';

// ============================================
// パース結果
// ============================================

/**
 * URLパース結果
 */
export interface ParsedUrl {
  type: UrlType;
  prefSlug?: string;
  citySlug?: string;
  makerSlug?: string;
  modelSlug?: string;
  featureSlug?: string;
  detailId?: string;
  freewordKeyword?: string;
  query?: Record<string, string | string[] | undefined>;
  page?: number;
  sort?: string;
}

// ============================================
// リクエストコンテキスト
// ============================================

/**
 * SEO評価のリクエストコンテキスト
 */
export interface SeoRequestContext {
  /** 現在のパス（例: /cars/p-kanagawa/） */
  pathname: Pathname;

  /** クエリパラメータ */
  query: Record<string, string | string[] | undefined>;

  /** 検索結果件数（必須：検索結果数ガードのため） */
  totalCount: number;

  /** ベースURL（環境変数NEXT_PUBLIC_BASE_URLから取得） */
  baseUrl: AbsoluteUrl;

  /** 検索パラメータ（オプション：詳細判定用） */
  searchParams?: {
    q?: string;
    keyword?: string;
    maker?: string;
    pref?: string;
    city?: string;
    feature?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    sort?: string;
    [key: string]: any;
  };
}

// ============================================
// SEO評価結果
// ============================================

/**
 * SEO評価結果
 */
export interface SeoResult {
  /** robots meta タグの値 */
  robots: RobotsMetaContent;

  /** canonical URL（絶対URL） */
  canonicalUrl: AbsoluteUrl;

  /** リダイレクト先URL（301リダイレクトする場合） */
  redirectUrl?: AbsoluteUrl;

  /** ページタイトル */
  title: string;

  /** h1タグの内容 */
  h1: string;

  /** meta description */
  description: string;

  /** デバッグ情報（ログ用） */
  debugReason?: string;

  /** URL種別 */
  urlType: UrlType;

  /** パース結果 */
  parsedUrl: ParsedUrl;
}

// ============================================
// index状態（ヒステリシス用）
// ============================================

/**
 * index状態
 */
export type IndexState = 'index' | 'noindex';

/**
 * ヒステリシス判定結果
 */
export interface HysteresisResult {
  /** 最終的なindex状態 */
  state: IndexState;

  /** 前回の状態 */
  previousState: IndexState | null;

  /** 判定理由 */
  reason: string;

  /** しきい値を超えたかどうか */
  thresholdMet: boolean;
}

// ============================================
// スコープ別設定
// ============================================

/**
 * スコープ（検索範囲）
 */
export type Scope = 'national' | 'prefecture' | 'city' | 'feature' | 'maker' | 'model' | 'other';

/**
 * スコープ別しきい値設定
 */
export interface ScopeThresholds {
  scope: Scope;
  minIndexCount: number;
  indexOnThreshold: number;
  indexOffThreshold: number;
}

// ============================================
// ユーティリティ型
// ============================================

/**
 * feature種別（ホワイトリスト）
 */
export type FeatureSlug =
  | '4wd'
  | 'hybrid'
  | 'mt'
  | 'diesel'
  | 'suv'
  | 'minivan'
  | 'kei'
  | 'wagon'
  | 'sedan'
  | 'hatchback';

/**
 * クエリ正規化後の値
 */
export type NormalizedQueryValue = string;
