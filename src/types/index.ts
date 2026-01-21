export interface Car {
  id: string;
  maker: string;
  model: string;
  year: number;
  mileage: number; // 走行距離 (km)
  hasRepairHistory: boolean; // 修復歴
  hasInspection: boolean; // 法定整備
  shaken: string; // 車検有無 (例: "車検整備付", "2025年3月", "なし")
  warranty: string; // 保証 (例: "付き / 3ヵ月 / 3,000km", "なし")
  region: string;
  pref: string;
  city: string;
  priceYen: number;
  prevPriceYen: number;
  updatedAt: number;
  postedAt: number;
  priceChangedAt: number | null;
  shop: string;
  // SEO用slugフィールド（検索で使用）
  makerSlug?: string;
  modelSlug?: string;
  prefSlug?: string;
  citySlug?: string;

  /** feature slug一覧（検索フィルタで使用） */
  featureSlugs?: string[];
}

export interface Filters {
  /** メーカーslug（例: toyota） */
  makerSlug: string;

  /** 都道府県slug（例: tokyo） */
  prefSlug: string;

  /** 市区町村slug（例: minato） */
  citySlug: string;

  /** feature slug（例: hybrid） */
  featureSlug: string;

  minMan: string;
  maxMan: string;
  priceChangedOnly: boolean;
}

export interface Estimate {
  carId: string;
  carSnapshot?: {
    id: string;
    maker: string;
    model: string;
    year: number;
    priceYen: number;
    region: string;
    pref: string;
    city: string;
  };
  name: string;
  email: string;
  tel: string;
  contact: string;
  note: string;
  createdAt: number;
}

export type SortBy = 'relevance' | 'live' | 'updated_desc' | 'price_asc' | 'price_desc';

export interface Shop {
  name: string;
  address: string;
  tel: string;
  hours: string;
  description: string;
}
