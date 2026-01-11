import type { Car } from '@/types';

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

// 共通デフォルト値（保守性向上のため）
const defaultCarFields = {
  mileage: 35000,
  hasRepairHistory: false,
  hasInspection: true,
  shaken: "車検整備付",
  warranty: "付き / 3ヵ月 / 3,000km"
};

export const carPool: Car[] = [
  {
    ...defaultCarFields,
    id: "c1",
    maker: "トヨタ",
    model: "プリウス S",
    year: 2020,
    mileage: 32000,
    region: "関東",
    pref: "東京都",
    city: "港区",
    priceYen: 1780000,
    prevPriceYen: 1830000,
    updatedAt: now - 12 * 60 * 1000,
    postedAt: now - 8 * DAY,
    priceChangedAt: now - 3 * 60 * 60 * 1000,
    shop: "○○モータース"
  },
  {
    ...defaultCarFields,
    id: "c2",
    maker: "ホンダ",
    model: "N-BOX カスタム",
    year: 2021,
    mileage: 21000,
    shaken: "2026年3月",
    warranty: "付き / 6ヵ月 / 6,000km",
    region: "関西",
    pref: "大阪府",
    city: "大阪市",
    priceYen: 1490000,
    prevPriceYen: 1490000,
    updatedAt: now - 40 * 60 * 1000,
    postedAt: now - 2 * DAY,
    priceChangedAt: null,
    shop: "カーショップA"
  },
  {
    ...defaultCarFields,
    id: "c3",
    maker: "日産",
    model: "ノート e-POWER",
    year: 2019,
    mileage: 55000,
    region: "中部",
    pref: "愛知県",
    city: "名古屋市",
    priceYen: 1120000,
    prevPriceYen: 1180000,
    updatedAt: now - 2 * 60 * 60 * 1000,
    postedAt: now - 15 * DAY,
    priceChangedAt: now - 20 * 60 * 60 * 1000,
    shop: "クルマ館"
  },
  {
    ...defaultCarFields,
    id: "c4",
    maker: "スズキ",
    model: "ジムニー",
    year: 2022,
    mileage: 12000,
    shaken: "2027年2月",
    warranty: "付き / 12ヵ月 / 12,000km",
    region: "九州",
    pref: "福岡県",
    city: "福岡市",
    priceYen: 2150000,
    prevPriceYen: 2100000,
    updatedAt: now - 25 * 60 * 1000,
    postedAt: now - 6 * DAY,
    priceChangedAt: now - 90 * 60 * 1000,
    shop: "九州オート"
  },
  {
    ...defaultCarFields,
    id: "c5",
    maker: "マツダ",
    model: "CX-5",
    year: 2018,
    mileage: 68000,
    region: "関東",
    pref: "神奈川県",
    city: "横浜市",
    priceYen: 1680000,
    prevPriceYen: 1680000,
    updatedAt: now - 3 * DAY,
    postedAt: now - 28 * DAY,
    priceChangedAt: null,
    shop: "横浜カーセレクト"
  },
  {
    ...defaultCarFields,
    id: "c_old",
    maker: "トヨタ",
    model: "アクア",
    year: 2017,
    mileage: 82000,
    hasRepairHistory: true,
    hasInspection: false,
    shaken: "なし",
    warranty: "なし",
    region: "関東",
    pref: "千葉県",
    city: "千葉市",
    priceYen: 790000,
    prevPriceYen: 820000,
    updatedAt: now - 31 * DAY,
    postedAt: now - 40 * DAY,
    priceChangedAt: now - 35 * DAY,
    shop: "古いデータ屋"
  }
];
