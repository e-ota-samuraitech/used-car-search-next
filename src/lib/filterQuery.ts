/**
 * URL クエリの parse/build ユーティリティ
 *
 * 絞り込み条件をURLクエリとして管理し、SSR/CSRで一貫した状態を保つ
 */

import type { NextRouter } from 'next/router';

// ============================================
// 型定義
// ============================================

export interface FilterState {
  /** メーカーslug（複数可） */
  makers: string[];
  /** 特徴slug（複数可） */
  features: string[];
  /** 都道府県slug（単一） */
  pref: string;
  /** 市区町村slug（単一） */
  city: string;
  /** 価格下限（万円） */
  min: string;
  /** 価格上限（万円） */
  max: string;
}

export const EMPTY_FILTER_STATE: FilterState = {
  makers: [],
  features: [],
  pref: '',
  city: '',
  min: '',
  max: '',
};

// ============================================
// Parse 関数
// ============================================

/**
 * string | string[] | undefined を string[] に正規化
 */
export function toStringArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string' && v.trim() !== '');
  const trimmed = value.trim();
  return trimmed ? [trimmed] : [];
}

/**
 * string | string[] | undefined を string に正規化（最初の値を取る）
 */
export function toSingleString(value: string | string[] | undefined): string {
  if (!value) return '';
  if (Array.isArray(value)) return value[0]?.trim() ?? '';
  return value.trim();
}

/**
 * URL クエリから FilterState をパース
 */
export function parseFilterQuery(
  query: Record<string, string | string[] | undefined>
): FilterState {
  // 新仕様キー優先、旧キーもフォールバック
  const makers = toStringArray(query.maker);
  const features = toStringArray(query.feat);
  const pref = toSingleString(query.pref);
  const city = toSingleString(query.city);
  const min = toSingleString(query.min);
  const max = toSingleString(query.max);

  // Note: pc/priceChangedOnly params are now ignored (feature removed)

  return { makers, features, pref, city, min, max };
}

/**
 * フリーワード q をパース
 */
export function parseQueryQ(query: Record<string, string | string[] | undefined>): string {
  return toSingleString(query.q);
}

/**
 * ページ番号をパース（デフォルト1）
 */
export function parseQueryPage(query: Record<string, string | string[] | undefined>): number {
  const raw = toSingleString(query.page);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// ============================================
// Build 関数
// ============================================

export interface BuildQueryOptions {
  /** フリーワード */
  q?: string;
  /** フィルタ状態 */
  filter: FilterState;
  /** ページ番号（省略時は1、フィルタ更新時は1にリセット） */
  page?: number;
  /** ソート */
  sort?: string;
}

/**
 * FilterState から URLSearchParams を構築
 *
 * page は明示的に渡された場合のみセット（1の場合は省略）
 */
export function buildFilterQueryParams(options: BuildQueryOptions): URLSearchParams {
  const { q, filter, page, sort } = options;
  const params = new URLSearchParams();

  // q
  if (q?.trim()) {
    params.set('q', q.trim());
  }

  // maker（複数）
  for (const m of filter.makers) {
    if (m.trim()) params.append('maker', m.trim());
  }

  // feat（複数）
  for (const f of filter.features) {
    if (f.trim()) params.append('feat', f.trim());
  }

  // pref
  if (filter.pref.trim()) {
    params.set('pref', filter.pref.trim());
  }

  // city
  if (filter.city.trim()) {
    params.set('city', filter.city.trim());
  }

  // min/max
  if (filter.min.trim()) {
    params.set('min', filter.min.trim());
  }
  if (filter.max.trim()) {
    params.set('max', filter.max.trim());
  }

  // page（1より大きい場合のみ）
  if (typeof page === 'number' && page > 1) {
    params.set('page', String(page));
  }

  // sort
  if (sort?.trim()) {
    params.set('sort', sort.trim());
  }

  return params;
}

/**
 * /cars/* dynamic route かどうかを判定
 * - router.pathname が [... を含む場合（テンプレート）
 * - router.asPath が /cars/ で始まる場合
 */
function isCarsDynamicRoute(router: NextRouter): boolean {
  return (
    router.pathname.includes('[...') ||
    router.asPath.startsWith('/cars/')
  );
}

/**
 * フィルタ更新時にURLを更新（page=1にリセット）
 *
 * /cars/* の場合は /results にフォールバック（SEO正規URLを維持するため）
 * /results の場合はそのまま /results
 */
export function pushFilterUpdate(
  router: NextRouter,
  newFilter: FilterState,
  options?: { q?: string; sort?: string }
): void {
  const params = buildFilterQueryParams({
    q: options?.q,
    filter: newFilter,
    page: 1, // フィルタ更新時は常に1
    sort: options?.sort,
  });

  // /cars/* は SEO着地用なので、フィルタ操作は /results にフォールバック
  const basePath = isCarsDynamicRoute(router) ? '/results' : '/results';

  const qs = params.toString();
  const url = qs ? `${basePath}?${qs}` : basePath;

  router.push(url, undefined, { scroll: true });
}

/**
 * ページ移動時にURLを更新（フィルタは維持）
 *
 * /cars/* の場合は /results にフォールバック
 */
export function pushPageChange(
  router: NextRouter,
  currentFilter: FilterState,
  newPage: number,
  options?: { q?: string; sort?: string }
): void {
  const params = buildFilterQueryParams({
    q: options?.q,
    filter: currentFilter,
    page: newPage,
    sort: options?.sort,
  });

  // /cars/* は SEO着地用なので、ページ操作は /results にフォールバック
  const basePath = isCarsDynamicRoute(router) ? '/results' : '/results';

  const qs = params.toString();
  const url = qs ? `${basePath}?${qs}` : basePath;

  router.push(url, undefined, { scroll: true });
}

/**
 * 全条件リセット（q/sort は維持、filter はクリア、page=1）
 */
export function pushFilterReset(
  router: NextRouter,
  options?: { q?: string; sort?: string }
): void {
  pushFilterUpdate(router, EMPTY_FILTER_STATE, options);
}

// ============================================
// ヘルパー
// ============================================

/**
 * FilterState が空かどうか判定
 */
export function isFilterEmpty(filter: FilterState): boolean {
  return (
    filter.makers.length === 0 &&
    filter.features.length === 0 &&
    !filter.pref &&
    !filter.city &&
    !filter.min &&
    !filter.max
  );
}

/**
 * 価格のバリデーション＆正規化（min > max なら入れ替え）
 */
export function normalizePrice(min: string, max: string): { min: string; max: string } {
  const minNum = parseInt(min, 10);
  const maxNum = parseInt(max, 10);

  if (Number.isFinite(minNum) && Number.isFinite(maxNum) && minNum > maxNum) {
    return { min: max, max: min };
  }

  return { min, max };
}
