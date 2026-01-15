/**
 * フィルター条件から構造化URLを生成
 *
 * 正規化できる条件（pref/maker/city/feature）→ 短URL（/cars/...）
 * 細かい条件（価格、ソート等）→ クエリパラメータとして追加
 */

import type { Pathname } from './types';
import { URL_PREFIXES } from './config';

// ============================================
// 日本語名 → slug 変換辞書
// ============================================

/**
 * 都道府県名 → slug
 */
const PREF_NAME_TO_SLUG: Record<string, string> = {
  '東京都': 'tokyo',
  '神奈川県': 'kanagawa',
  '千葉県': 'chiba',
  '埼玉県': 'saitama',
  '大阪府': 'osaka',
  '兵庫県': 'hyogo',
  '京都府': 'kyoto',
  '愛知県': 'aichi',
  '静岡県': 'shizuoka',
  '福岡県': 'fukuoka',
  '熊本県': 'kumamoto',
  '宮城県': 'miyagi',
  // 「県」なし版
  '東京': 'tokyo',
  '神奈川': 'kanagawa',
  '千葉': 'chiba',
  '埼玉': 'saitama',
  '大阪': 'osaka',
  '兵庫': 'hyogo',
  '京都': 'kyoto',
  '愛知': 'aichi',
  '静岡': 'shizuoka',
  '福岡': 'fukuoka',
  '熊本': 'kumamoto',
  '宮城': 'miyagi',
};

/**
 * メーカー名 → slug
 */
const MAKER_NAME_TO_SLUG: Record<string, string> = {
  'トヨタ': 'toyota',
  'ホンダ': 'honda',
  '日産': 'nissan',
  'スズキ': 'suzuki',
  'マツダ': 'mazda',
  'スバル': 'subaru',
  'ダイハツ': 'daihatsu',
  '三菱': 'mitsubishi',
  'レクサス': 'lexus',
  'アウディ': 'audi',
  'ジープ': 'jeep',
  'フォルクスワーゲン': 'volkswagen',
  'プジョー': 'peugeot',
  'ボルボ': 'volvo',
  'メルセデス・ベンツ': 'mercedes-benz',
  'BMW': 'bmw',
  'MINI': 'mini',
};

/**
 * 市区町村名 → { prefSlug, citySlug }
 * 都道府県が分かっている場合はシンプルなslugで良い
 */
const CITY_NAME_TO_SLUG: Record<string, string> = {
  '横浜市': 'yokohama',
  '川崎市': 'kawasaki',
  '名古屋市': 'nagoya',
  '横浜': 'yokohama',
  '川崎': 'kawasaki',
  '名古屋': 'nagoya',
  // 必要に応じて追加
};

// ============================================
// フィルター型
// ============================================

export interface FilterParams {
  maker?: string;
  region?: string;
  pref?: string;
  city?: string;
  minMan?: string;
  maxMan?: string;
  priceChangedOnly?: boolean;
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
 * 2. pref + city → /cars/p-{pref}/c-{city}/
 * 3. pref + maker → /cars/p-{pref}/m-{maker}/
 * 4. pref のみ → /cars/p-{pref}/
 * 5. maker のみ → /cars/m-{maker}/
 * 6. それ以外 → /cars/ + クエリパラメータ
 */
export function buildFilterUrl(filters: FilterParams): BuildFilterUrlResult {
  const queryParams = new URLSearchParams();

  // slug変換
  const prefSlug = filters.pref ? PREF_NAME_TO_SLUG[filters.pref] : undefined;
  const makerSlug = filters.maker ? MAKER_NAME_TO_SLUG[filters.maker] : undefined;
  const citySlug = filters.city ? CITY_NAME_TO_SLUG[filters.city] : undefined;

  // 構造化URLのパス部分を決定
  let pathname: Pathname = '/cars/';
  let isStructured = false;

  // pref + city + maker
  if (prefSlug && citySlug && makerSlug) {
    pathname = `/cars/${URL_PREFIXES.PREF}${prefSlug}/${URL_PREFIXES.CITY}${citySlug}/${URL_PREFIXES.MAKER}${makerSlug}/` as Pathname;
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

  // pref/city/makerがslug変換できなかった場合（未定義のメーカー等）
  if (filters.pref && !prefSlug) {
    queryParams.set('pref', filters.pref);
  }
  if (filters.city && !citySlug) {
    queryParams.set('city', filters.city);
  }
  if (filters.maker && !makerSlug) {
    queryParams.set('maker', filters.maker);
  }

  // 細かい条件は常にクエリパラメータ
  if (filters.minMan) {
    queryParams.set('minMan', filters.minMan);
  }
  if (filters.maxMan) {
    queryParams.set('maxMan', filters.maxMan);
  }
  if (filters.priceChangedOnly) {
    queryParams.set('priceChangedOnly', 'true');
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

// 辞書のエクスポート（他モジュールで再利用可能に）
export { PREF_NAME_TO_SLUG, MAKER_NAME_TO_SLUG, CITY_NAME_TO_SLUG };
