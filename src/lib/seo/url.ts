/**
 * SEOライブラリ - URL処理
 * パース、正規化、canonical生成、昇格先URL生成
 */

import type { AbsoluteUrl, Pathname, ParsedUrl, UrlType } from './types';
import { URL_PREFIXES, isValidSlug } from './config';

// ============================================
// URL正規化
// ============================================

/**
 * パス名を正規化（末尾スラッシュあり）
 */
export function normalizePathname(pathname: string): Pathname {
  let normalized = pathname.trim();

  // 先頭にスラッシュがなければ追加
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  // 末尾スラッシュがなければ追加（ただし拡張子がある場合は除く）
  if (!normalized.endsWith('/') && !normalized.match(/\.[a-z]+$/i)) {
    normalized += '/';
  }

  return normalized as Pathname;
}

/**
 * クエリパラメータ値を正規化
 */
export function normalizeQueryValue(value: string | string[] | undefined): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value[0] ?? '';
  return String(value);
}

/**
 * 絶対URLを生成
 */
export function buildAbsoluteUrl(baseUrl: string, pathname: Pathname): AbsoluteUrl {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}${pathname}` as AbsoluteUrl;
}

// ============================================
// URLパース
// ============================================

/**
 * パスから接頭辞付きslugを抽出
 * 例: "p-kanagawa" → { prefix: "p-", slug: "kanagawa" }
 */
function extractPrefixedSlug(segment: string): { prefix: string; slug: string } | null {
  // 接頭辞パターン: p-, c-, m-, s-, f-, d-
  const match = segment.match(/^([pcdmsf]-)(.+)$/);
  if (!match) return null;

  const [, prefix, slug] = match;
  if (!isValidSlug(slug)) return null;

  return { prefix, slug };
}

/**
 * URLをパースして構造を抽出
 *
 * 対応パターン:
 * - /cars/ → cars-top
 * - /cars/p-{pref}/ → pref
 * - /cars/p-{pref}/c-{city}/ → city
 * - /cars/m-{maker}/ → maker
 * - /cars/m-{maker}/s-{model}/ → model
 * - /cars/f-{feature}/ → feature
 * - /cars/p-{pref}/f-{feature}/ → pref-feature
 * - /cars/p-{pref}/m-{maker}/ → pref-maker
 * - /cars/p-{pref}/c-{city}/m-{maker}/ → city-maker
 * - /cars/d-{id}/ → detail
 * - /results/freeword/{keyword}/index.html → freeword
 */
export function parseUrl(pathname: string, query?: Record<string, string | string[] | undefined>): ParsedUrl {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split('/').filter(s => s.length > 0);

  // page と sort をクエリから取得
  const pageRaw = query?.page ? parseInt(normalizeQueryValue(query.page), 10) : NaN;
  const page = Number.isFinite(pageRaw) ? pageRaw : undefined;
  const sort = query?.sort ? normalizeQueryValue(query.sort) : undefined;

  const withCommonFields = <T extends Omit<ParsedUrl, 'query' | 'page' | 'sort'>>(base: T): ParsedUrl => {
    const result: ParsedUrl = { ...base };
    if (query) result.query = query;
    if (page !== undefined) result.page = page;
    if (sort) result.sort = sort;
    return result;
  };

  // フリーワード検索パターン: /results/freeword/{keyword}/index.html
  if (segments[0] === 'results' && segments[1] === 'freeword' && segments[2]) {
    return withCommonFields({
      type: 'freeword',
      freewordKeyword: decodeURIComponent(segments[2].replace(/\.html$/, '')),
    });
  }

  // /cars/ 配下以外はquery-searchまたはunknown
  if (segments[0] !== 'cars') {
    // クエリパラメータがある場合
    if (query && (query.q || query.keyword || query.maker || query.pref)) {
      return withCommonFields({ type: 'query-search' });
    }
    return withCommonFields({ type: 'unknown' });
  }

  // /cars/ のみ → cars-top
  if (segments.length === 1) {
    return withCommonFields({ type: 'cars-top' });
  }

  // セグメントをパース
  const parsed: Record<string, string> = {};
  let currentPref = '';
  let currentCity = '';
  let currentMaker = '';

  for (let i = 1; i < segments.length; i++) {
    const extracted = extractPrefixedSlug(segments[i]);
    if (!extracted) continue;

    const { prefix, slug } = extracted;

    switch (prefix) {
      case URL_PREFIXES.PREF:
        parsed.pref = slug;
        currentPref = slug;
        break;
      case URL_PREFIXES.CITY:
        parsed.city = slug;
        currentCity = slug;
        break;
      case URL_PREFIXES.MAKER:
        parsed.maker = slug;
        currentMaker = slug;
        break;
      case URL_PREFIXES.MODEL:
        parsed.model = slug;
        break;
      case URL_PREFIXES.FEATURE:
        parsed.feature = slug;
        break;
      case URL_PREFIXES.DETAIL:
        parsed.detail = slug;
        break;
    }
  }

  // 車両詳細
  if (parsed.detail) {
    return withCommonFields({
      type: 'detail',
      detailId: parsed.detail,
    });
  }

  // 都道府県 + 市区町村 + メーカー
  if (parsed.pref && parsed.city && parsed.maker) {
    return withCommonFields({
      type: 'city-maker',
      prefSlug: parsed.pref,
      citySlug: parsed.city,
      makerSlug: parsed.maker,
    });
  }

  // 都道府県 + メーカー + 車種
  if (parsed.pref && parsed.maker && parsed.model) {
    return withCommonFields({
      type: 'pref-model',
      prefSlug: parsed.pref,
      makerSlug: parsed.maker,
      modelSlug: parsed.model,
    });
  }

  // 都道府県 + メーカー
  if (parsed.pref && parsed.maker) {
    return withCommonFields({
      type: 'pref-maker',
      prefSlug: parsed.pref,
      makerSlug: parsed.maker,
    });
  }

  // 都道府県 + feature
  if (parsed.pref && parsed.feature) {
    return withCommonFields({
      type: 'pref-feature',
      prefSlug: parsed.pref,
      featureSlug: parsed.feature,
    });
  }

  // 都道府県 + 市区町村
  if (parsed.pref && parsed.city) {
    return withCommonFields({
      type: 'city',
      prefSlug: parsed.pref,
      citySlug: parsed.city,
    });
  }

  // 都道府県のみ
  if (parsed.pref) {
    return withCommonFields({
      type: 'pref',
      prefSlug: parsed.pref,
    });
  }

  // メーカー + 車種
  if (parsed.maker && parsed.model) {
    return withCommonFields({
      type: 'model',
      makerSlug: parsed.maker,
      modelSlug: parsed.model,
    });
  }

  // メーカーのみ
  if (parsed.maker) {
    return withCommonFields({
      type: 'maker',
      makerSlug: parsed.maker,
    });
  }

  // feature全国
  if (parsed.feature) {
    return withCommonFields({
      type: 'feature',
      featureSlug: parsed.feature,
    });
  }

  // その他（クエリ検索として扱う）
  return withCommonFields({ type: 'query-search' });
}

// ============================================
// 正規URL生成
// ============================================

/**
 * ParsedUrlから正規パスを生成
 */
export function buildCanonicalPath(parsed: ParsedUrl): Pathname {
  switch (parsed.type) {
    case 'cars-top':
      return '/cars/';

    case 'pref':
      return `/cars/${URL_PREFIXES.PREF}${parsed.prefSlug}/`;

    case 'city':
      return `/cars/${URL_PREFIXES.PREF}${parsed.prefSlug}/${URL_PREFIXES.CITY}${parsed.citySlug}/`;

    case 'maker':
      return `/cars/${URL_PREFIXES.MAKER}${parsed.makerSlug}/`;

    case 'model':
      return `/cars/${URL_PREFIXES.MAKER}${parsed.makerSlug}/${URL_PREFIXES.MODEL}${parsed.modelSlug}/`;

    case 'pref-model':
      return `/cars/${URL_PREFIXES.PREF}${parsed.prefSlug}/${URL_PREFIXES.MAKER}${parsed.makerSlug}/${URL_PREFIXES.MODEL}${parsed.modelSlug}/`;

    case 'feature':
      return `/cars/${URL_PREFIXES.FEATURE}${parsed.featureSlug}/`;

    case 'pref-feature':
      return `/cars/${URL_PREFIXES.PREF}${parsed.prefSlug}/${URL_PREFIXES.FEATURE}${parsed.featureSlug}/`;

    case 'pref-maker':
      return `/cars/${URL_PREFIXES.PREF}${parsed.prefSlug}/${URL_PREFIXES.MAKER}${parsed.makerSlug}/`;

    case 'city-maker':
      return `/cars/${URL_PREFIXES.PREF}${parsed.prefSlug}/${URL_PREFIXES.CITY}${parsed.citySlug}/${URL_PREFIXES.MAKER}${parsed.makerSlug}/`;

    case 'detail':
      return `/cars/${URL_PREFIXES.DETAIL}${parsed.detailId}/`;

    case 'freeword':
      // フリーワード検索は /results/freeword/{keyword}/index.html
      return `/results/freeword/${encodeURIComponent(parsed.freewordKeyword || 'search')}/index.html` as Pathname;

    case 'query-search':
    case 'unknown':
    default:
      // クエリ検索はcanonicalを持たない（または最も近い正規URLへ）
      return '/cars/';
  }
}

/**
 * 構造ホワイトリストに該当するかチェック
 *
 * 対象構造:
 * - 都道府県/市区町村: /cars/p-{pref}/c-{city}/
 * - 都道府県/メーカー: /cars/p-{pref}/m-{maker}/
 * - 都道府県/市区町村/メーカー: /cars/p-{pref}/c-{city}/m-{maker}/
 */
export function isStructuralWhitelisted(parsed: ParsedUrl): boolean {
  return (
    parsed.type === 'city' ||
    parsed.type === 'pref-maker' ||
    parsed.type === 'city-maker'
  );
}

/**
 * URLタイプが正規URL（短URL）かどうか
 */
export function isCanonicalUrlType(type: UrlType): boolean {
  const canonicalTypes: UrlType[] = [
    'cars-top',
    'pref',
    'city',
    'maker',
    'model',
    'pref-model',
    'feature',
    'pref-feature',
    'pref-maker',
    'city-maker',
    'detail',
  ];
  return canonicalTypes.includes(type);
}

/**
 * ページネーションや追加パラメータがあるかチェック
 */
export function hasNonCanonicalParams(parsed: ParsedUrl): boolean {
  // page >= 2 は noindex
  if (parsed.page && parsed.page >= 2) {
    return true;
  }

  // sort パラメータがある場合も noindex（必要に応じて調整）
  // if (parsed.sort) {
  //   return true;
  // }

  return false;
}
