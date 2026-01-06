import { createContext, useContext, useState, ReactNode } from 'react';
import { carPool } from '@/utils/data';
import { withinDays, shuffle, computeLiveScore } from '@/utils/helpers';
import type { Car, Filters, Estimate, SortBy } from '@/types';

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
  runSearch: () => void;
  findCar: (id: string) => Car | null;
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
  const [sortBy, setSortBy] = useState<SortBy>('live');
  const [results, setResults] = useState<Car[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  // フィルタリングロジック
  const applyFilters = (list: Car[]): Car[] => {
    let out = list.slice();

    if (filters.maker) out = out.filter(c => c.maker === filters.maker);
    if (filters.region) out = out.filter(c => c.region === filters.region);
    if (filters.pref) out = out.filter(c => c.pref === filters.pref);
    if (filters.city) out = out.filter(c => c.city === filters.city);

    const min = filters.minMan === '' ? null : Number(filters.minMan) * 10000;
    const max = filters.maxMan === '' ? null : Number(filters.maxMan) * 10000;
    if (min !== null) out = out.filter(c => c.priceYen >= min);
    if (max !== null) out = out.filter(c => c.priceYen <= max);

    if (filters.priceChangedOnly) {
      out = out.filter(c => c.prevPriceYen !== c.priceYen);
    }

    return out;
  };

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

  // 検索実行（スタブ）
  const runSearch = () => {
    const fresh = carPool.filter(c => withinDays(c.updatedAt, 30));
    const pickedCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
    let picked = shuffle(fresh).slice(0, pickedCount);

    picked = applyFilters(picked);
    picked = applySort(picked);

    setResults(picked);
  };

  // 車両を検索（IDから）
  const findCar = (id: string): Car | null => {
    const inResults = results.find(c => c.id === id);
    return inResults || carPool.find(c => c.id === id) || null;
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
    resetFilters,
    applySort,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
