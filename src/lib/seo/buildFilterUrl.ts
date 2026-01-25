/**
 * フィルター条件から構造化URLを生成
 *
 * 正規化できる条件（pref/maker/city/feature）→ 短URL（/cars/...）
 * 細かい条件（価格、ソート等）→ クエリパラメータとして追加
 */

import type { Pathname } from './types';
import { URL_PREFIXES } from './config';

function isValidSlugValue(slug: string | undefined): slug is string {
  return !!slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// ============================================
// フィルター型
// ============================================

export interface FilterParams {
  makerSlug?: string;
  prefSlug?: string;
  citySlug?: string;
  featureSlug?: string;
  minMan?: string;
  maxMan?: string;
  q?: string;
  sort?: string;
  page?: number;
}

// ============================================
// URL生成結果
// ============================================

export interface BuildFilterUrlResult {
  /** 生成されたURL（パス + クエリ） */
  url: string;

  /** 構造化URL部分（/cars/...） */
  pathname: Pathname;

  /** クエリパラメータ部分 */
  queryParams: URLSearchParams;

  /** 構造化URLに昇格できたかどうか */
  isStructured: boolean;
}

// ============================================
// メイン関数
// ============================================

/**
 * フィルター条件から構造化URLを生成
 *
 * 優先順位：
 * 1. pref + city + maker → /cars/p-{pref}/c-{city}/m-{maker}/
 * 2. pref + feature → /cars/p-{pref}/f-{feature}/
 * 3. feature → /cars/f-{feature}/
 * 4. pref + city → /cars/p-{pref}/c-{city}/
 * 5. pref + maker → /cars/p-{pref}/m-{maker}/
 * 6. pref のみ → /cars/p-{pref}/
 * 7. maker のみ → /cars/m-{maker}/
 * 6. それ以外 → /cars/ + クエリパラメータ
 */
export function buildFilterUrl(filters: FilterParams): BuildFilterUrlResult {
  const queryParams = new URLSearchParams();

  // slugs（URLに日本語を含めない方針）
  const prefSlug = isValidSlugValue(filters.prefSlug) ? filters.prefSlug : undefined;
  const citySlug = isValidSlugValue(filters.citySlug) ? filters.citySlug : undefined;
  const makerSlug = isValidSlugValue(filters.makerSlug) ? filters.makerSlug : undefined;
  const featureSlug = isValidSlugValue(filters.featureSlug) ? filters.featureSlug : undefined;

  // 構造化URLのパス部分を決定
  let pathname: Pathname = '/cars/';
  let isStructured = false;

  // pref + city + maker
  if (prefSlug && citySlug && makerSlug) {
    pathname = `/cars/${URL_PREFIXES.PREF}${prefSlug}/${URL_PREFIXES.CITY}${citySlug}/${URL_PREFIXES.MAKER}${makerSlug}/` as Pathname;
    isStructured = true;
  }
  // pref + feature
  else if (prefSlug && featureSlug) {
    pathname = `/cars/${URL_PREFIXES.PREF}${prefSlug}/${URL_PREFIXES.FEATURE}${featureSlug}/` as Pathname;
    isStructured = true;
  }
  // feature
  else if (featureSlug) {
    pathname = `/cars/${URL_PREFIXES.FEATURE}${featureSlug}/` as Pathname;
    isStructured = true;
  }
  // pref + city
  else if (prefSlug && citySlug) {
    pathname = `/cars/${URL_PREFIXES.PREF}${prefSlug}/${URL_PREFIXES.CITY}${citySlug}/` as Pathname;
    isStructured = true;
  }
  // pref + maker
  else if (prefSlug && makerSlug) {
    pathname = `/cars/${URL_PREFIXES.PREF}${prefSlug}/${URL_PREFIXES.MAKER}${makerSlug}/` as Pathname;
    isStructured = true;
  }
  // pref のみ
  else if (prefSlug) {
    pathname = `/cars/${URL_PREFIXES.PREF}${prefSlug}/` as Pathname;
    isStructured = true;
  }
  // maker のみ
  else if (makerSlug) {
    pathname = `/cars/${URL_PREFIXES.MAKER}${makerSlug}/` as Pathname;
    isStructured = true;
  }

  // 構造化URLに含められなかった条件をクエリパラメータに追加

  // spec方針: pref/city/maker/feature はURLに日本語を含めない。
  // 変換できない値は原則クエリにも載せない（"選べるのに構造化できない"事故を防ぐ）。

  // 細かい条件は常にクエリパラメータ
  if (filters.minMan) {
    queryParams.set('minMan', filters.minMan);
  }
  if (filters.maxMan) {
    queryParams.set('maxMan', filters.maxMan);
  }
  if (filters.q) {
    queryParams.set('q', filters.q);
  }
  if (filters.sort) {
    queryParams.set('sort', filters.sort);
  }
  if (filters.page && filters.page > 1) {
    queryParams.set('page', String(filters.page));
  }

  // 最終URLを組み立て
  const queryString = queryParams.toString();
  const url = queryString ? `${pathname}?${queryString}` : pathname;

  return {
    url,
    pathname,
    queryParams,
    isStructured,
  };
}

/**
 * slug → 日本語名の逆変換（表示用）
 */
export function prefSlugToName(slug: string): string {
  const reverseMap: Record<string, string> = {
    'tokyo': '東京都',
    'kanagawa': '神奈川県',
    'chiba': '千葉県',
    'saitama': '埼玉県',
    'osaka': '大阪府',
    'hyogo': '兵庫県',
    'kyoto': '京都府',
    'aichi': '愛知県',
    'shizuoka': '静岡県',
    'fukuoka': '福岡県',
    'kumamoto': '熊本県',
    'miyagi': '宮城県',
  };
  return reverseMap[slug] || slug;
}

export function makerSlugToName(slug: string): string {
  const reverseMap: Record<string, string> = {
    'toyota': 'トヨタ',
    'honda': 'ホンダ',
    'nissan': '日産',
    'suzuki': 'スズキ',
    'mazda': 'マツダ',
    'subaru': 'スバル',
    'daihatsu': 'ダイハツ',
    'mitsubishi': '三菱',
    'lexus': 'レクサス',
    'audi': 'アウディ',
    'jeep': 'ジープ',
    'volkswagen': 'フォルクスワーゲン',
    'peugeot': 'プジョー',
    'volvo': 'ボルボ',
    'mercedes-benz': 'メルセデス・ベンツ',
    'bmw': 'BMW',
    'mini': 'MINI',
  };
  return reverseMap[slug] || slug;
}

export function citySlugToName(slug: string): string {
  const reverseMap: Record<string, string> = {
    'yokohama': '横浜市',
    'kawasaki': '川崎市',
    'nagoya': '名古屋市',
  };
  return reverseMap[slug] || slug;
}
