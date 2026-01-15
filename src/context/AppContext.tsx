import { createContext, useContext, useState, ReactNode } from 'react';
import { mockCarDatabase } from '@/lib/mockCars';
import { findShopByName as findShopByNameLib } from '@/lib/mockShops';
import { computeLiveScore } from '@/utils/helpers';
import type { Car, Filters, Estimate, SortBy, Shop } from '@/types';

interface AppContextType {
  query: string;
  setQuery: (query: string) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
  results: Car[];
  setResults: (results: Car[]) => void;
  estimate: Estimate | null;
  setEstimate: (estimate: Estimate | null) => void;
  runSearch: (input?: { query?: string; filters?: Filters }) => Promise<void>;
  findCar: (id: string) => Car | null;
  findCarsByShop: (shopName: string) => Car[];
  findShopByName: (shopName: string) => Shop | null;
  resetFilters: () => void;
  applySort: (list: Car[]) => Car[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const defaultFilters: Filters = {
  maker: '',
  region: '',
  pref: '',
  city: '',
  minMan: '',
  maxMan: '',
  priceChangedOnly: false,
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortBy>('updated_desc');
  const [results, setResults] = useState<Car[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  // ソートロジック
  const applySort = (list: Car[]): Car[] => {
    const out = list.slice();
    if (sortBy === 'live') {
      out.sort((a, b) => computeLiveScore(b) - computeLiveScore(a));
    } else if (sortBy === 'updated_desc') {
      out.sort((a, b) => b.updatedAt - a.updatedAt);
    } else if (sortBy === 'price_asc') {
      out.sort((a, b) => a.priceYen - b.priceYen);
    } else if (sortBy === 'price_desc') {
      out.sort((a, b) => b.priceYen - a.priceYen);
    }
    return out;
  };

  // 検索実行（/api/search を呼び出し）
  const runSearch = async (input?: { query?: string; filters?: Filters }) => {
    try {
      const effectiveQuery = input?.query ?? query;
      const effectiveFilters = input?.filters ?? filters;

      // クエリパラメータを構築
      const params = new URLSearchParams();

      if (effectiveQuery) params.append('q', effectiveQuery);
      if (effectiveFilters.maker) params.append('maker', effectiveFilters.maker);
      if (effectiveFilters.region) params.append('region', effectiveFilters.region);
      if (effectiveFilters.pref) params.append('pref', effectiveFilters.pref);
      if (effectiveFilters.city) params.append('city', effectiveFilters.city);
      if (effectiveFilters.minMan) params.append('minMan', effectiveFilters.minMan);
      if (effectiveFilters.maxMan) params.append('maxMan', effectiveFilters.maxMan);
      if (effectiveFilters.priceChangedOnly) params.append('priceChangedOnly', 'true');

      // API呼び出し
      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Search API failed');
      }

      const data = await response.json();
      const items: Car[] = data.items || [];

      // ソートを適用してから結果をセット
      const sorted = applySort(items);
      setResults(sorted);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  };

  // 車両を検索（IDから）
  const findCar = (id: string): Car | null => {
    const inResults = results.find(c => c.id === id);
    return inResults || mockCarDatabase.find(c => c.id === id) || null;
  };

  // 店舗名から車両を検索
  const findCarsByShop = (shopName: string): Car[] => {
    return mockCarDatabase.filter(car => car.shop === shopName);
  };

  // 店舗名から店舗情報を取得
  const findShopByName = (shopName: string): Shop | null => {
    return findShopByNameLib(shopName);
  };

  // フィルタをリセット
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const value: AppContextType = {
    query,
    setQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    results,
    setResults,
    estimate,
    setEstimate,
    runSearch,
    findCar,
    findCarsByShop,
    findShopByName,
    resetFilters,
    applySort,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
