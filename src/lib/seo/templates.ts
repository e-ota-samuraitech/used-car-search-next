/**
 * SEOライブラリ - title/h1/description テンプレート生成
 * 仕様書 Ver.1.1 準拠
 */

import type { ParsedUrl } from './types';

// ============================================
// slug→日本語名マッピング
// ============================================

/**
 * 都道府県slug → 日本語名
 */
const PREF_NAMES: Record<string, string> = {
  tokyo: '東京',
  kanagawa: '神奈川',
  chiba: '千葉',
  saitama: '埼玉',
  osaka: '大阪',
  hyogo: '兵庫',
  kyoto: '京都',
  aichi: '愛知',
  shizuoka: '静岡',
  fukuoka: '福岡',
  kumamoto: '熊本',
  miyagi: '宮城',
};

/**
 * 市区町村slug → 日本語名
 */
const CITY_NAMES: Record<string, string> = {
  yokohama: '横浜',
  kawasaki: '川崎',
  nagoya: '名古屋',
  // 必要に応じて追加
};

/**
 * メーカーslug → 日本語名
 */
const MAKER_NAMES: Record<string, string> = {
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
 * featureslug → 日本語名
 */
const FEATURE_NAMES: Record<string, string> = {
  '4wd': '4WD',
  'hybrid': 'ハイブリッド',
  'mt': 'MT',
  'diesel': 'ディーゼル',
  'suv': 'SUV',
  'minivan': 'ミニバン',
  'kei': '軽自動車',
  'wagon': 'ワゴン',
  'sedan': 'セダン',
  'hatchback': 'ハッチバック',
};

/**
 * feature日本語表示名（H1用など、より詳細）
 */
const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  '4wd': '4WD（四駆）',
  'hybrid': 'ハイブリッド',
  'mt': 'MT（マニュアル）',
  'diesel': 'ディーゼル',
  'suv': 'SUV',
  'minivan': 'ミニバン',
  'kei': '軽自動車',
  'wagon': 'ワゴン',
  'sedan': 'セダン',
  'hatchback': 'ハッチバック',
};

// ============================================
// ヘルパー関数
// ============================================

function getPrefName(slug?: string): string {
  if (!slug) return '';
  return PREF_NAMES[slug] || slug;
}

function getCityName(slug?: string): string {
  if (!slug) return '';
  return CITY_NAMES[slug] || slug;
}

function getMakerName(slug?: string): string {
  if (!slug) return '';
  return MAKER_NAMES[slug] || slug;
}

function getFeatureName(slug?: string): string {
  if (!slug) return '';
  return FEATURE_NAMES[slug] || slug;
}

function getFeatureDisplayName(slug?: string): string {
  if (!slug) return '';
  return FEATURE_DISPLAY_NAMES[slug] || slug;
}

// ============================================
// テンプレート生成
// ============================================

export interface SeoTexts {
  title: string;
  h1: string;
  description: string;
}

/**
 * ParsedUrlからSEOテキストを生成
 *
 * 仕様書の具体例:
 * - /cars/: title: 中古車検索｜更新が早い中古車情報
 * - /cars/p-kanagawa/: title: 神奈川の中古車｜最新更新順で探せる中古車一覧
 * - /cars/p-kanagawa/c-yokohama/: title: 横浜の中古車｜最新更新順の中古車一覧
 * - /cars/m-toyota/: title: トヨタの中古車｜最新更新順で探せるトヨタ車
 * - /cars/f-4wd/: title: 4WD中古車｜最新更新順で探せる四駆の中古車
 * - /cars/d-123456/: title: トヨタ プリウス 1.8 S｜129.8万円｜中古車情報
 */
export function generateSeoTexts(parsed: ParsedUrl, carData?: any): SeoTexts {
  switch (parsed.type) {
    // 1. /cars/ - 検索トップ
    case 'cars-top':
      return {
        title: '中古車検索｜更新が早い中古車情報',
        h1: '更新が早い中古車検索',
        description: '更新が早い中古車情報をまとめて検索。全国の最新在庫を条件別に探せます。',
      };

    // 2. /cars/p-{pref}/ - 都道府県
    case 'pref': {
      const prefName = getPrefName(parsed.prefSlug);
      return {
        title: `${prefName}の中古車｜最新更新順で探せる中古車一覧`,
        h1: `${prefName}の中古車一覧`,
        description: `${prefName}で販売中の中古車を最新更新順で掲載。条件別に在庫を確認できます。`,
      };
    }

    // 3. /cars/p-{pref}/c-{city}/ - 市区町村
    case 'city': {
      const prefName = getPrefName(parsed.prefSlug);
      const cityName = getCityName(parsed.citySlug);
      return {
        title: `${cityName}の中古車｜最新更新順の中古車一覧`,
        h1: `${cityName}の中古車一覧`,
        description: `${cityName}市で販売されている中古車を最新更新順で紹介します。`,
      };
    }

    // 4. /cars/m-{maker}/ - メーカー
    case 'maker': {
      const makerName = getMakerName(parsed.makerSlug);
      return {
        title: `${makerName}の中古車｜最新更新順で探せる${makerName}車`,
        h1: `${makerName}の中古車一覧`,
        description: `${makerName}の中古車を最新更新順で掲載。人気車種の在庫を確認できます。`,
      };
    }

    // 5. /cars/m-{maker}/s-{model}/ - 車種
    case 'model': {
      const makerName = getMakerName(parsed.makerSlug);
      const modelName = parsed.modelSlug || '';
      const modelDisplay = modelName ? ` ${modelName}` : '';
      return {
        title: `${makerName}${modelDisplay}の中古車｜最新更新順で探せる中古車一覧`,
        h1: `${makerName}${modelDisplay}の中古車一覧`,
        description: `${makerName}${modelDisplay}の中古車を最新更新順で掲載。条件別に在庫を確認できます。`,
      };
    }

    // 6. /cars/f-{feature}/ - feature全国
    case 'feature': {
      const featureName = getFeatureName(parsed.featureSlug);
      const featureDisplay = getFeatureDisplayName(parsed.featureSlug);
      return {
        title: `${featureName}中古車｜最新更新順で探せる${featureDisplay}の中古車`,
        h1: `${featureDisplay}の中古車一覧`,
        description: `${featureDisplay}の中古車を最新更新順で掲載しています。`,
      };
    }

    // 7. /cars/p-{pref}/f-{feature}/ - 都道府県×feature
    case 'pref-feature': {
      const prefName = getPrefName(parsed.prefSlug);
      const featureName = getFeatureName(parsed.featureSlug);
      const featureDisplay = getFeatureDisplayName(parsed.featureSlug);
      return {
        title: `${prefName}の${featureName}中古車｜最新更新順の一覧`,
        h1: `${prefName}の${featureDisplay}中古車一覧`,
        description: `${prefName}で販売中の${featureDisplay}中古車を最新更新順で掲載。`,
      };
    }

    // 8. /cars/p-{pref}/m-{maker}/ - 都道府県×メーカー
    case 'pref-maker': {
      const prefName = getPrefName(parsed.prefSlug);
      const makerName = getMakerName(parsed.makerSlug);
      return {
        title: `${prefName}の${makerName}中古車｜最新更新順の一覧`,
        h1: `${prefName}の${makerName}中古車一覧`,
        description: `${prefName}で販売中の${makerName}中古車を最新更新順で掲載。在庫状況を確認できます。`,
      };
    }

    // 9. /cars/p-{pref}/c-{city}/m-{maker}/ - 都道府県×市区町村×メーカー
    case 'city-maker': {
      const cityName = getCityName(parsed.citySlug);
      const makerName = getMakerName(parsed.makerSlug);
      return {
        title: `${cityName}の${makerName}中古車｜最新更新順の一覧`,
        h1: `${cityName}の${makerName}中古車一覧`,
        description: `${cityName}で販売中の${makerName}中古車を最新更新順で掲載。`,
      };
    }

    // 10. /cars/d-{id}/ - 車両詳細
    case 'detail': {
      if (carData) {
        const { maker, model, grade, price } = carData;
        const priceMan = price ? `${(price / 10000).toFixed(1)}万円` : '';
        return {
          title: `${maker} ${model} ${grade}｜${priceMan}｜中古車情報`,
          h1: `${maker} ${model} ${grade}`,
          description: `${maker} ${model} ${grade}の中古車情報。価格や年式、装備などの詳細を掲載。`,
        };
      }
      return {
        title: '中古車詳細情報',
        h1: '中古車詳細',
        description: '中古車の詳細情報をご確認いただけます。',
      };
    }

    // 11. /results/freeword/{keyword}/index.html - フリーワード検索
    case 'freeword': {
      const keyword = parsed.freewordKeyword || '検索';
      return {
        title: `「${keyword}」の検索結果｜中古車情報`,
        h1: `「${keyword}」の検索結果`,
        description: `「${keyword}」で検索した中古車の一覧です。最新の在庫情報を掲載しています。`,
      };
    }

    // 12. その他（クエリ検索など）
    case 'query-search':
    default:
      return {
        title: '中古車検索結果｜更新が早い中古車情報',
        h1: '中古車検索結果',
        description: '検索条件に合致する中古車を最新更新順で掲載しています。',
      };
  }
}

/**
 * カスタムテキストを適用（オーバーライド用）
 */
export function applySeoTextsOverride(
  base: SeoTexts,
  override?: Partial<SeoTexts>
): SeoTexts {
  if (!override) return base;

  return {
    title: override.title ?? base.title,
    h1: override.h1 ?? base.h1,
    description: override.description ?? base.description,
  };
}
