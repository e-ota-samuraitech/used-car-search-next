export interface Car {
  id: string;
  maker: string;
  model: string;
  year: number;
  region: string;
  pref: string;
  city: string;
  priceYen: number;
  prevPriceYen: number;
  updatedAt: number;
  postedAt: number;
  priceChangedAt: number | null;
  shop: string;
}

export interface Filters {
  maker: string;
  region: string;
  pref: string;
  city: string;
  minMan: string;
  maxMan: string;
  priceChangedOnly: boolean;
}

export interface Estimate {
  carId: string;
  name: string;
  email: string;
  tel: string;
  contact: string;
  note: string;
  createdAt: number;
}

export type SortBy = 'live' | 'updated_desc' | 'price_asc' | 'price_desc';

export interface Shop {
  name: string;
  address: string;
  tel: string;
  hours: string;
  description: string;
}
