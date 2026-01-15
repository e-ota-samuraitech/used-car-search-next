/**
 * SEOライブラリ - 設定値・定数・ホワイトリスト
 * 中古車検索サイト SEO仕様書 Ver.1.1 準拠
 */

import type { FeatureSlug, Scope, ScopeThresholds } from './types';

// ============================================
// featureホワイトリスト（暫定）
// ============================================

/**
 * index対象として許可されるfeature一覧
 * 仕様書: 4wd / hybrid / mt / diesel / suv / minivan / kei / wagon / sedan / hatchback
 */
export const FEATURE_WHITELIST: ReadonlySet<FeatureSlug> = new Set<FeatureSlug>([
  '4wd',
  'hybrid',
  'mt',
  'diesel',
  'suv',
  'minivan',
  'kei',
  'wagon',
  'sedan',
  'hatchback',
]);

/**
 * featureがホワイトリストに含まれるかチェック
 */
export function isFeatureWhitelisted(feature: string): feature is FeatureSlug {
  return FEATURE_WHITELIST.has(feature as FeatureSlug);
}

// ============================================
// スコープ別しきい値設定
// ============================================

/**
 * スコープ別のしきい値（推奨初期値）
 *
 * 仕様書の基準値:
 * - 全国軸: 300〜500件以上
 * - 都道府県配下: 50〜100件以上
 * - 市区町村: 50件以上
 * - featureページ: 全国500件以上 / 都道府県50件以上
 * - MVP段階では共通値（例：50件）から開始可能
 */
export const SCOPE_THRESHOLDS: ReadonlyArray<ScopeThresholds> = [
  {
    scope: 'national',
    minIndexCount: 300,
    indexOnThreshold: 400,    // この件数以上でindex候補へ
    indexOffThreshold: 250,   // この件数未満で強制noindex
  },
  {
    scope: 'prefecture',
    minIndexCount: 50,
    indexOnThreshold: 80,
    indexOffThreshold: 40,
  },
  {
    scope: 'city',
    minIndexCount: 50,
    indexOnThreshold: 70,
    indexOffThreshold: 35,
  },
  {
    scope: 'feature',
    minIndexCount: 500,       // 全国feature
    indexOnThreshold: 600,
    indexOffThreshold: 400,
  },
  {
    scope: 'maker',
    minIndexCount: 100,
    indexOnThreshold: 150,
    indexOffThreshold: 80,
  },
  {
    scope: 'model',
    minIndexCount: 30,
    indexOnThreshold: 50,
    indexOffThreshold: 25,
  },
  {
    scope: 'other',
    minIndexCount: 50,        // デフォルト
    indexOnThreshold: 70,
    indexOffThreshold: 35,
  },
];

/**
 * スコープに応じたしきい値を取得
 */
export function getThresholds(scope: Scope): ScopeThresholds {
  return SCOPE_THRESHOLDS.find(t => t.scope === scope) || SCOPE_THRESHOLDS[SCOPE_THRESHOLDS.length - 1];
}

/**
 * URLタイプからスコープを推測
 */
export function inferScope(
  urlType: string,
  hasPrefix?: { pref?: boolean; city?: boolean; feature?: boolean; maker?: boolean; model?: boolean }
): Scope {
  // feature系
  if (urlType.includes('feature')) {
    return 'feature';
  }

  // 市区町村
  if (urlType.includes('city') || hasPrefix?.city) {
    return 'city';
  }

  // 都道府県
  if (urlType.includes('pref') || hasPrefix?.pref) {
    return 'prefecture';
  }

  // 車種
  if (urlType.includes('model') || hasPrefix?.model) {
    return 'model';
  }

  // メーカー
  if (urlType.includes('maker') || hasPrefix?.maker) {
    return 'maker';
  }

  // 全国トップ
  if (urlType === 'cars-top') {
    return 'national';
  }

  return 'other';
}

// ============================================
// ベースURL（環境変数から取得）
// ============================================

/**
 * サイトのベースURL（canonical生成用）
 * NEXT_PUBLIC_BASE_URLが未設定の場合は空文字
 */
export function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  // 末尾スラッシュを削除
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

/**
 * ベースURLが有効かチェック
 */
export function isValidBaseUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

// ============================================
// グローバル設定（環境変数でオーバーライド可能）
// ============================================

/**
 * デフォルトの最小index件数（MVP用）
 * 環境変数 SEO_MIN_INDEX_COUNT でオーバーライド可能
 */
export function getMinIndexCount(scope?: Scope): number {
  // 環境変数が設定されている場合はそちらを優先
  const envValue = process.env.SEO_MIN_INDEX_COUNT;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // スコープ別のデフォルト値
  if (scope) {
    const thresholds = getThresholds(scope);
    return thresholds.minIndexCount;
  }

  // デフォルト: 50件
  return 50;
}

/**
 * ヒステリシス: index ON しきい値
 */
export function getIndexOnThreshold(scope?: Scope): number {
  const envValue = process.env.SEO_INDEX_ON_THRESHOLD;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  if (scope) {
    const thresholds = getThresholds(scope);
    return thresholds.indexOnThreshold;
  }

  return 70;
}

/**
 * ヒステリシス: index OFF しきい値
 */
export function getIndexOffThreshold(scope?: Scope): number {
  const envValue = process.env.SEO_INDEX_OFF_THRESHOLD;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  if (scope) {
    const thresholds = getThresholds(scope);
    return thresholds.indexOffThreshold;
  }

  return 35;
}

// ============================================
// URL接頭辞定義
// ============================================

/**
 * URL接頭辞パターン
 */
export const URL_PREFIXES = {
  PREF: 'p-',
  CITY: 'c-',
  MAKER: 'm-',
  MODEL: 's-',
  FEATURE: 'f-',
  DETAIL: 'd-',
} as const;

/**
 * 接頭辞のバリデーション
 */
export function isValidSlugChar(char: string): boolean {
  return /^[a-z0-9-]$/.test(char);
}

/**
 * slug全体のバリデーション
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
