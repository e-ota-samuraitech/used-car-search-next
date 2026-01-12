import type { MakerSlug, PrefSlug } from './types';

export const PREF_SLUG_TO_NAME = {
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
} as const satisfies Record<PrefSlug, string>;

export const PREF_NAME_TO_SLUG = {
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
} as const satisfies Record<string, PrefSlug>;

export const MAKER_SLUG_TO_NAME = {
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
} as const satisfies Record<MakerSlug, string>;

export const MAKER_NAME_TO_SLUG = {
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
} as const satisfies Record<string, MakerSlug>;

export function toPrefSlug(prefName: string): PrefSlug | null {
  if (!prefName) return null;
  return (PREF_NAME_TO_SLUG as Record<string, PrefSlug | undefined>)[prefName] ?? null;
}

export function toMakerSlug(makerName: string): MakerSlug | null {
  if (!makerName) return null;
  return (MAKER_NAME_TO_SLUG as Record<string, MakerSlug | undefined>)[makerName] ?? null;
}
