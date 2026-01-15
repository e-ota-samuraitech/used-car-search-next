/**
 * SEOライブラリ - キーワード昇格辞書
 * q/keyword パラメータから短URLへの昇格判定と優先順位ロジック
 */

import type { Pathname } from './types';
import { URL_PREFIXES } from './config';

// ============================================
// 昇格辞書（日本語 → slug）
// ============================================

/**
 * メーカー名辞書
 */
const MAKER_DICTIONARY: Record<string, string> = {
  // 日本メーカー
  'トヨタ': 'toyota',
  'toyota': 'toyota',
  'ホンダ': 'honda',
  'honda': 'honda',
  '日産': 'nissan',
  'nissan': 'nissan',
  'スズキ': 'suzuki',
  'suzuki': 'suzuki',
  'マツダ': 'mazda',
  'mazda': 'mazda',
  'スバル': 'subaru',
  'subaru': 'subaru',
  'ダイハツ': 'daihatsu',
  'daihatsu': 'daihatsu',
  '三菱': 'mitsubishi',
  'mitsubishi': 'mitsubishi',
  'レクサス': 'lexus',
  'lexus': 'lexus',
  // 海外メーカー
  'アウディ': 'audi',
  'audi': 'audi',
  'ジープ': 'jeep',
  'jeep': 'jeep',
  'フォルクスワーゲン': 'volkswagen',
  'volkswagen': 'volkswagen',
  'プジョー': 'peugeot',
  'peugeot': 'peugeot',
  'ボルボ': 'volvo',
  'volvo': 'volvo',
  'メルセデス・ベンツ': 'mercedes-benz',
  'メルセデスベンツ': 'mercedes-benz',
  'mercedes-benz': 'mercedes-benz',
  'mercedes': 'mercedes-benz',
  'benz': 'mercedes-benz',
  'bmw': 'bmw',
  'BMW': 'bmw',
  'mini': 'mini',
  'MINI': 'mini',
  'ミニ': 'mini',
};

/**
 * feature辞書
 */
const FEATURE_DICTIONARY: Record<string, string> = {
  '4wd': '4wd',
  '4WD': '4wd',
  '四駆': '4wd',
  'ハイブリッド': 'hybrid',
  'hybrid': 'hybrid',
  'HV': 'hybrid',
  'MT': 'mt',
  'mt': 'mt',
  'マニュアル': 'mt',
  'ディーゼル': 'diesel',
  'diesel': 'diesel',
  'SUV': 'suv',
  'suv': 'suv',
  'ミニバン': 'minivan',
  'minivan': 'minivan',
  '軽自動車': 'kei',
  '軽': 'kei',
  'kei': 'kei',
  'ワゴン': 'wagon',
  'wagon': 'wagon',
  'セダン': 'sedan',
  'sedan': 'sedan',
  'ハッチバック': 'hatchback',
  'hatchback': 'hatchback',
};

/**
 * 都道府県名辞書
 */
const PREF_DICTIONARY: Record<string, string> = {
  '東京': 'tokyo',
  '東京都': 'tokyo',
  'tokyo': 'tokyo',
  '神奈川': 'kanagawa',
  '神奈川県': 'kanagawa',
  'kanagawa': 'kanagawa',
  '千葉': 'chiba',
  '千葉県': 'chiba',
  'chiba': 'chiba',
  '埼玉': 'saitama',
  '埼玉県': 'saitama',
  'saitama': 'saitama',
  '大阪': 'osaka',
  '大阪府': 'osaka',
  'osaka': 'osaka',
  '兵庫': 'hyogo',
  '兵庫県': 'hyogo',
  'hyogo': 'hyogo',
  '京都': 'kyoto',
  '京都府': 'kyoto',
  'kyoto': 'kyoto',
  '愛知': 'aichi',
  '愛知県': 'aichi',
  'aichi': 'aichi',
  '静岡': 'shizuoka',
  '静岡県': 'shizuoka',
  'shizuoka': 'shizuoka',
  '福岡': 'fukuoka',
  '福岡県': 'fukuoka',
  'fukuoka': 'fukuoka',
  '熊本': 'kumamoto',
  '熊本県': 'kumamoto',
  'kumamoto': 'kumamoto',
  '宮城': 'miyagi',
  '宮城県': 'miyagi',
  'miyagi': 'miyagi',
};

/**
 * 市区町村辞書（代表例のみ。実装時に拡張）
 */
const CITY_DICTIONARY: Record<string, { pref: string; city: string }> = {
  '横浜': { pref: 'kanagawa', city: 'yokohama' },
  '横浜市': { pref: 'kanagawa', city: 'yokohama' },
  'yokohama': { pref: 'kanagawa', city: 'yokohama' },
  '川崎': { pref: 'kanagawa', city: 'kawasaki' },
  '川崎市': { pref: 'kanagawa', city: 'kawasaki' },
  'kawasaki': { pref: 'kanagawa', city: 'kawasaki' },
  '名古屋': { pref: 'aichi', city: 'nagoya' },
  '名古屋市': { pref: 'aichi', city: 'nagoya' },
  'nagoya': { pref: 'aichi', city: 'nagoya' },
  // 必要に応じて追加
};

/**
 * 車種辞書（メーカーと紐づけが必要）
 * 実際の実装では、メーカーとの組み合わせでマッチングする
 */
const MODEL_DICTIONARY: Record<string, { maker: string; model: string }> = {
  'プリウス': { maker: 'toyota', model: 'prius' },
  'prius': { maker: 'toyota', model: 'prius' },
  'アクア': { maker: 'toyota', model: 'aqua' },
  'aqua': { maker: 'toyota', model: 'aqua' },
  'フィット': { maker: 'honda', model: 'fit' },
  'fit': { maker: 'honda', model: 'fit' },
  'ヴェゼル': { maker: 'honda', model: 'vezel' },
  'vezel': { maker: 'honda', model: 'vezel' },
  'ノート': { maker: 'nissan', model: 'note' },
  'note': { maker: 'nissan', model: 'note' },
  // 必要に応じて追加
};

// ============================================
// キーワード正規化
// ============================================

/**
 * キーワードを正規化（トリム、小文字化、全角→半角）
 */
export function normalizeKeyword(keyword: string): string {
  return keyword
    .trim()
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角→半角
    .replace(/\s+/g, ''); // 空白削除
}

// ============================================
// 昇格判定（優先順位付き）
// ============================================

/**
 * 昇格判定結果
 */
export interface UpgradeResult {
  /** 昇格可能かどうか */
  canUpgrade: boolean;

  /** 昇格先のパス（301リダイレクト先） */
  upgradePath?: Pathname;

  /** マッチした種別 */
  matchType?: 'maker' | 'model' | 'feature' | 'pref' | 'city';

  /** 検出されたslug情報 */
  detected?: {
    makerSlug?: string;
    modelSlug?: string;
    featureSlug?: string;
    prefSlug?: string;
    citySlug?: string;
  };
}

/**
 * キーワードから短URLへの昇格を判定
 *
 * 優先順位（仕様書準拠）:
 * 1) メーカー
 * 2) 車種（メーカー特定できる場合のみ）
 * 3) feature
 * 4) 都道府県
 * 5) 市区町村（都道府県が特定できる場合）
 * 6) それ以外 → 昇格不可（フリーワード検索）
 */
export function evaluateKeywordUpgrade(keyword: string): UpgradeResult {
  const normalized = normalizeKeyword(keyword);

  if (!normalized) {
    return { canUpgrade: false };
  }

  // 1. メーカー判定
  const makerSlug = MAKER_DICTIONARY[normalized];
  if (makerSlug) {
    return {
      canUpgrade: true,
      upgradePath: `/cars/${URL_PREFIXES.MAKER}${makerSlug}/` as Pathname,
      matchType: 'maker',
      detected: { makerSlug },
    };
  }

  // 2. 車種判定（メーカーとセット）
  const modelInfo = MODEL_DICTIONARY[normalized];
  if (modelInfo) {
    return {
      canUpgrade: true,
      upgradePath: `/cars/${URL_PREFIXES.MAKER}${modelInfo.maker}/${URL_PREFIXES.MODEL}${modelInfo.model}/` as Pathname,
      matchType: 'model',
      detected: {
        makerSlug: modelInfo.maker,
        modelSlug: modelInfo.model,
      },
    };
  }

  // 3. feature判定
  const featureSlug = FEATURE_DICTIONARY[normalized];
  if (featureSlug) {
    return {
      canUpgrade: true,
      upgradePath: `/cars/${URL_PREFIXES.FEATURE}${featureSlug}/` as Pathname,
      matchType: 'feature',
      detected: { featureSlug },
    };
  }

  // 4. 都道府県判定
  const prefSlug = PREF_DICTIONARY[normalized];
  if (prefSlug) {
    return {
      canUpgrade: true,
      upgradePath: `/cars/${URL_PREFIXES.PREF}${prefSlug}/` as Pathname,
      matchType: 'pref',
      detected: { prefSlug },
    };
  }

  // 5. 市区町村判定（都道府県とセット）
  const cityInfo = CITY_DICTIONARY[normalized];
  if (cityInfo) {
    return {
      canUpgrade: true,
      upgradePath: `/cars/${URL_PREFIXES.PREF}${cityInfo.pref}/${URL_PREFIXES.CITY}${cityInfo.city}/` as Pathname,
      matchType: 'city',
      detected: {
        prefSlug: cityInfo.pref,
        citySlug: cityInfo.city,
      },
    };
  }

  // 6. 昇格不可 → フリーワード検索
  return { canUpgrade: false };
}

/**
 * クエリパラメータから昇格を評価
 */
export function evaluateQueryUpgrade(query: Record<string, string | string[] | undefined>): UpgradeResult {
  // q または keyword パラメータを取得
  const qValue = query.q || query.keyword;
  if (!qValue) {
    return { canUpgrade: false };
  }

  const keyword = Array.isArray(qValue) ? qValue[0] : qValue;
  if (!keyword) {
    return { canUpgrade: false };
  }

  return evaluateKeywordUpgrade(keyword);
}

// ============================================
// 辞書拡張用のヘルパー（将来の拡張用）
// ============================================

/**
 * メーカー辞書にエントリを追加（ランタイム拡張用）
 */
export function addMakerEntry(keyword: string, slug: string): void {
  MAKER_DICTIONARY[normalizeKeyword(keyword)] = slug;
}

/**
 * feature辞書にエントリを追加
 */
export function addFeatureEntry(keyword: string, slug: string): void {
  FEATURE_DICTIONARY[normalizeKeyword(keyword)] = slug;
}

/**
 * 都道府県辞書にエントリを追加
 */
export function addPrefEntry(keyword: string, slug: string): void {
  PREF_DICTIONARY[normalizeKeyword(keyword)] = slug;
}

/**
 * 市区町村辞書にエントリを追加
 */
export function addCityEntry(keyword: string, prefSlug: string, citySlug: string): void {
  CITY_DICTIONARY[normalizeKeyword(keyword)] = { pref: prefSlug, city: citySlug };
}

/**
 * 車種辞書にエントリを追加
 */
export function addModelEntry(keyword: string, makerSlug: string, modelSlug: string): void {
  MODEL_DICTIONARY[normalizeKeyword(keyword)] = { maker: makerSlug, model: modelSlug };
}
