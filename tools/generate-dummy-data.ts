/**
 * Vertex AI Search Phase A 用ダミーデータ生成スクリプト
 *
 * 実行方法:
 *   npx tsx tools/generate-dummy-data.ts [件数]
 *
 * 出力:
 *   data/vertex/cars_dummy.jsonl (NDJSON形式)
 *
 * 特徴:
 *   - seed固定の疑似乱数（再生成しても同じデータ）
 *   - Car型（src/types/index.ts）に完全互換
 *   - 外部通信なし
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Seeded Random Number Generator (Linear Congruential Generator)
// ============================================================
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  pickMultiple<T>(arr: readonly T[], count: number): T[] {
    const result: T[] = [];
    const indices = new Set<number>();
    const maxCount = Math.min(count, arr.length);
    while (indices.size < maxCount) {
      indices.add(this.nextInt(0, arr.length - 1));
    }
    const indicesArray = Array.from(indices);
    for (let i = 0; i < indicesArray.length; i++) {
      result.push(arr[indicesArray[i]]);
    }
    return result;
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }
}

// ============================================================
// Master Data Types & Constants
// ============================================================
interface City {
  name: string;
  slug: string;
}

interface Prefecture {
  region: string;
  pref: string;
  prefSlug: string;
  cities: City[];
}

interface Maker {
  name: string;
  slug: string;
  models: string[];
}

interface Feature {
  slug: string;
  name: string;
}

const MAKERS: Maker[] = [
  { name: 'トヨタ', slug: 'toyota', models: ['プリウス', 'アクア', 'カローラ', 'ヤリス', 'RAV4', 'ハリアー', 'アルファード', 'ヴォクシー', 'ノア', 'クラウン'] },
  { name: 'ホンダ', slug: 'honda', models: ['フィット', 'ヴェゼル', 'N-BOX', 'ステップワゴン', 'フリード', 'シビック', 'アコード', 'オデッセイ'] },
  { name: '日産', slug: 'nissan', models: ['ノート', 'セレナ', 'エクストレイル', 'リーフ', 'スカイライン', 'フェアレディZ', 'エルグランド', 'デイズ'] },
  { name: 'マツダ', slug: 'mazda', models: ['CX-5', 'CX-30', 'マツダ3', 'マツダ6', 'ロードスター', 'CX-8', 'CX-60'] },
  { name: 'スバル', slug: 'subaru', models: ['インプレッサ', 'レヴォーグ', 'フォレスター', 'レガシィ', 'XV', 'クロストレック', 'WRX'] },
  { name: 'スズキ', slug: 'suzuki', models: ['スイフト', 'ハスラー', 'ジムニー', 'ワゴンR', 'アルト', 'スペーシア', 'クロスビー', 'エスクード'] },
  { name: 'ダイハツ', slug: 'daihatsu', models: ['タント', 'ムーヴ', 'ミラ', 'ロッキー', 'トール', 'ウェイク', 'キャスト'] },
  { name: 'レクサス', slug: 'lexus', models: ['RX', 'NX', 'UX', 'ES', 'LS', 'IS', 'LC', 'LX'] },
  { name: 'BMW', slug: 'bmw', models: ['3シリーズ', '5シリーズ', 'X3', 'X5', '1シリーズ', 'X1', '7シリーズ'] },
  { name: 'メルセデス・ベンツ', slug: 'mercedes-benz', models: ['Cクラス', 'Eクラス', 'GLC', 'Aクラス', 'GLE', 'Sクラス', 'CLA'] },
];

const PREFECTURES: Prefecture[] = [
  { region: '北海道', pref: '北海道', prefSlug: 'hokkaido', cities: [{ name: '札幌市', slug: 'sapporo' }, { name: '旭川市', slug: 'asahikawa' }, { name: '函館市', slug: 'hakodate' }] },
  { region: '東北', pref: '宮城県', prefSlug: 'miyagi', cities: [{ name: '仙台市', slug: 'sendai' }, { name: '石巻市', slug: 'ishinomaki' }] },
  { region: '関東', pref: '東京都', prefSlug: 'tokyo', cities: [{ name: '港区', slug: 'minato' }, { name: '新宿区', slug: 'shinjuku' }, { name: '渋谷区', slug: 'shibuya' }, { name: '世田谷区', slug: 'setagaya' }, { name: '品川区', slug: 'shinagawa' }] },
  { region: '関東', pref: '神奈川県', prefSlug: 'kanagawa', cities: [{ name: '横浜市', slug: 'yokohama' }, { name: '川崎市', slug: 'kawasaki' }, { name: '相模原市', slug: 'sagamihara' }] },
  { region: '関東', pref: '千葉県', prefSlug: 'chiba', cities: [{ name: '千葉市', slug: 'chiba-city' }, { name: '船橋市', slug: 'funabashi' }, { name: '柏市', slug: 'kashiwa' }] },
  { region: '関東', pref: '埼玉県', prefSlug: 'saitama', cities: [{ name: 'さいたま市', slug: 'saitama-city' }, { name: '川口市', slug: 'kawaguchi' }, { name: '越谷市', slug: 'koshigaya' }] },
  { region: '中部', pref: '愛知県', prefSlug: 'aichi', cities: [{ name: '名古屋市', slug: 'nagoya' }, { name: '豊田市', slug: 'toyota-city' }, { name: '岡崎市', slug: 'okazaki' }] },
  { region: '中部', pref: '静岡県', prefSlug: 'shizuoka', cities: [{ name: '静岡市', slug: 'shizuoka-city' }, { name: '浜松市', slug: 'hamamatsu' }] },
  { region: '関西', pref: '大阪府', prefSlug: 'osaka', cities: [{ name: '大阪市', slug: 'osaka-city' }, { name: '堺市', slug: 'sakai' }, { name: '東大阪市', slug: 'higashiosaka' }] },
  { region: '関西', pref: '兵庫県', prefSlug: 'hyogo', cities: [{ name: '神戸市', slug: 'kobe' }, { name: '姫路市', slug: 'himeji' }, { name: '西宮市', slug: 'nishinomiya' }] },
  { region: '関西', pref: '京都府', prefSlug: 'kyoto', cities: [{ name: '京都市', slug: 'kyoto-city' }, { name: '宇治市', slug: 'uji' }] },
  { region: '中国', pref: '広島県', prefSlug: 'hiroshima', cities: [{ name: '広島市', slug: 'hiroshima-city' }, { name: '福山市', slug: 'fukuyama' }] },
  { region: '九州', pref: '福岡県', prefSlug: 'fukuoka', cities: [{ name: '福岡市', slug: 'fukuoka-city' }, { name: '北九州市', slug: 'kitakyushu' }, { name: '久留米市', slug: 'kurume' }] },
];

const FEATURES: Feature[] = [
  { slug: 'hybrid', name: 'ハイブリッド' },
  { slug: 'electric', name: '電気自動車' },
  { slug: 'one_owner', name: 'ワンオーナー' },
  { slug: 'no_smoking', name: '禁煙車' },
  { slug: 'four_wheel', name: '4WD' },
  { slug: 'car_navi', name: 'カーナビ' },
  { slug: 'back_camera', name: 'バックカメラ' },
  { slug: 'sunroof', name: 'サンルーフ' },
  { slug: 'leather_seat', name: '革シート' },
  { slug: 'heated_seat', name: 'シートヒーター' },
  { slug: 'cruise_control', name: 'クルーズコントロール' },
  { slug: 'lane_assist', name: '車線維持支援' },
  { slug: 'auto_brake', name: '自動ブレーキ' },
  { slug: 'parking_assist', name: '駐車支援' },
];

const SHAKEN_OPTIONS: string[] = [
  '車検整備付',
  '車検2年付',
  '2025年3月',
  '2025年6月',
  '2025年9月',
  '2025年12月',
  '2026年3月',
  '2026年6月',
  'なし',
];

const WARRANTY_OPTIONS: string[] = [
  '付き / 3ヵ月 / 3,000km',
  '付き / 6ヵ月 / 5,000km',
  '付き / 12ヵ月 / 10,000km',
  '付き / 24ヵ月 / 無制限',
  'ディーラー保証継承',
  'なし',
];

const SHOP_NAMES: string[] = [
  'オートガレージ',
  'カーショップ',
  'モータース',
  '自動車販売',
  'オートセンター',
  'カーステーション',
  'オートプラザ',
];

// ============================================================
// Vertex AI Search 用ドキュメント型（Car型互換）
// ============================================================
interface VertexCarDocument {
  // 必須フィールド（Car型と一致）
  id: string;
  maker: string;
  model: string;
  year: number;
  mileage: number;
  hasRepairHistory: boolean;
  hasInspection: boolean;
  shaken: string;
  warranty: string;
  region: string;
  pref: string;
  city: string;
  priceYen: number;
  prevPriceYen: number;
  updatedAt: number;
  postedAt: number;
  priceChangedAt: number | null;
  shop: string;

  // オプショナル（検索/SEO用）
  makerSlug: string;
  modelSlug: string;
  prefSlug: string;
  citySlug: string;
  featureSlugs: string[];

  // 拡張フィールド（Vertex用）
  title: string;
  updatedAtIso: string;
  imageMain: string;
  raw: {
    carsensor: {
      body_cd: string;
      color: string;
      displacement: string;
      mission: string;
    };
  };
}

// ============================================================
// Helper Functions
// ============================================================
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ー－]/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateModelSlug(model: string): string {
  const romanized: Record<string, string> = {
    'プリウス': 'prius',
    'アクア': 'aqua',
    'カローラ': 'corolla',
    'ヤリス': 'yaris',
    'RAV4': 'rav4',
    'ハリアー': 'harrier',
    'アルファード': 'alphard',
    'ヴォクシー': 'voxy',
    'ノア': 'noah',
    'クラウン': 'crown',
    'フィット': 'fit',
    'ヴェゼル': 'vezel',
    'N-BOX': 'n-box',
    'ステップワゴン': 'stepwgn',
    'フリード': 'freed',
    'シビック': 'civic',
    'アコード': 'accord',
    'オデッセイ': 'odyssey',
    'ノート': 'note',
    'セレナ': 'serena',
    'エクストレイル': 'x-trail',
    'リーフ': 'leaf',
    'スカイライン': 'skyline',
    'フェアレディZ': 'fairlady-z',
    'エルグランド': 'elgrand',
    'デイズ': 'dayz',
    'CX-5': 'cx-5',
    'CX-30': 'cx-30',
    'マツダ3': 'mazda3',
    'マツダ6': 'mazda6',
    'ロードスター': 'roadster',
    'CX-8': 'cx-8',
    'CX-60': 'cx-60',
    'インプレッサ': 'impreza',
    'レヴォーグ': 'levorg',
    'フォレスター': 'forester',
    'レガシィ': 'legacy',
    'XV': 'xv',
    'クロストレック': 'crosstrek',
    'WRX': 'wrx',
    'スイフト': 'swift',
    'ハスラー': 'hustler',
    'ジムニー': 'jimny',
    'ワゴンR': 'wagon-r',
    'アルト': 'alto',
    'スペーシア': 'spacia',
    'クロスビー': 'xbee',
    'エスクード': 'escudo',
    'タント': 'tanto',
    'ムーヴ': 'move',
    'ミラ': 'mira',
    'ロッキー': 'rocky',
    'トール': 'thor',
    'ウェイク': 'wake',
    'キャスト': 'cast',
    'RX': 'rx',
    'NX': 'nx',
    'UX': 'ux',
    'ES': 'es',
    'LS': 'ls',
    'IS': 'is',
    'LC': 'lc',
    'LX': 'lx',
    '3シリーズ': '3-series',
    '5シリーズ': '5-series',
    'X3': 'x3',
    'X5': 'x5',
    '1シリーズ': '1-series',
    'X1': 'x1',
    '7シリーズ': '7-series',
    'Cクラス': 'c-class',
    'Eクラス': 'e-class',
    'GLC': 'glc',
    'Aクラス': 'a-class',
    'GLE': 'gle',
    'Sクラス': 's-class',
    'CLA': 'cla',
  };
  return romanized[model] || toSlug(model) || 'unknown';
}

const BODY_CODES = ['SD', 'HB', 'SW', 'CP', 'CV', 'SUV', 'VAN', 'WGN'];
const COLORS = ['ホワイトパール', 'ブラック', 'シルバー', 'レッド', 'ブルー', 'グレー', 'ブラウン', 'グリーン'];
const DISPLACEMENTS = ['660', '1000', '1200', '1500', '1800', '2000', '2500', '3000', '3500'];
const MISSIONS = ['AT', 'CVT', 'MT', 'DCT'];

// ============================================================
// Data Generator
// ============================================================
function generateCar(rng: SeededRandom, index: number): VertexCarDocument {
  const maker = rng.pick(MAKERS);
  const model = rng.pick(maker.models);
  const prefecture = rng.pick(PREFECTURES);
  const city = rng.pick(prefecture.cities);

  const year = rng.nextInt(2015, 2024);
  const mileage = rng.nextInt(1000, 150000);
  const basePrice = rng.nextInt(500000, 8000000);
  const priceYen = Math.round(basePrice / 10000) * 10000; // 万円単位に丸める
  const hasPriceChanged = rng.bool(0.3);
  const prevPriceYen = hasPriceChanged ? priceYen + rng.nextInt(50000, 300000) : priceYen;

  const baseDate = new Date('2025-01-01T00:00:00Z').getTime();
  const postedAt = baseDate - rng.nextInt(0, 180 * 24 * 60 * 60 * 1000);
  const updatedAt = postedAt + rng.nextInt(0, 30 * 24 * 60 * 60 * 1000);
  const priceChangedAt = hasPriceChanged ? updatedAt - rng.nextInt(0, 7 * 24 * 60 * 60 * 1000) : null;

  const featureSlugs = rng.bool(0.7)
    ? rng.pickMultiple(FEATURES, rng.nextInt(1, 5)).map((f) => f.slug)
    : [];

  const shopSuffix = rng.pick(SHOP_NAMES);
  const shop = `${city.name}${shopSuffix}`;

  const id = `car-${String(index + 1).padStart(6, '0')}`;
  const title = `${maker.name} ${model} ${year}年式`;
  const modelSlug = generateModelSlug(model);

  return {
    id,
    maker: maker.name,
    model,
    year,
    mileage,
    hasRepairHistory: rng.bool(0.1),
    hasInspection: rng.bool(0.7),
    shaken: rng.pick(SHAKEN_OPTIONS),
    warranty: rng.pick(WARRANTY_OPTIONS),
    region: prefecture.region,
    pref: prefecture.pref,
    city: city.name,
    priceYen,
    prevPriceYen,
    updatedAt,
    postedAt,
    priceChangedAt,
    shop,

    makerSlug: maker.slug,
    modelSlug,
    prefSlug: prefecture.prefSlug,
    citySlug: city.slug,
    featureSlugs,

    title,
    updatedAtIso: new Date(updatedAt).toISOString(),
    imageMain: `https://example.com/images/${id}.jpg`,
    raw: {
      carsensor: {
        body_cd: rng.pick(BODY_CODES),
        color: rng.pick(COLORS),
        displacement: rng.pick(DISPLACEMENTS),
        mission: rng.pick(MISSIONS),
      },
    },
  };
}

// ============================================================
// Main
// ============================================================
function main(): void {
  const args = process.argv.slice(2);
  const count = parseInt(args[0] || '500', 10);

  if (isNaN(count) || count < 1 || count > 10000) {
    console.error('Usage: npx tsx tools/generate-dummy-data.ts [件数 (1-10000)]');
    process.exit(1);
  }

  const SEED = 20250118; // 固定シード
  const rng = new SeededRandom(SEED);

  const outputDir = path.resolve(__dirname, '../data/vertex');
  const outputFile = path.join(outputDir, 'cars_dummy.jsonl');

  // ディレクトリ作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // NDJSON生成
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const car = generateCar(rng, i);
    lines.push(JSON.stringify(car));
  }

  fs.writeFileSync(outputFile, lines.join('\n') + '\n', 'utf-8');

  console.log(`Generated ${count} cars to ${outputFile}`);
  console.log(`Sample (first 2 lines):`);
  console.log(lines.slice(0, 2).join('\n'));
}

main();
