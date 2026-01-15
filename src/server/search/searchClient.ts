import type { Car } from '@/types';
import { DEFAULT_PAGE_SIZE } from './config';
import { MockCarDataSource } from './dataSource/mockDataSource';
import { searchCars } from './searchService';
import type { SearchParams } from './types';

export type SearchSort = 'updated_desc' | 'price_asc' | 'price_desc' | 'live';

export interface SearchQuery {
  q?: string;

  prefSlug?: string;
  citySlug?: string;
  makerSlug?: string;
  modelSlug?: string;
  featureSlug?: string;

  minMan?: string;
  maxMan?: string;
  priceChangedOnly?: boolean;

  page?: number;
  pageSize?: number;
  sort?: SearchSort;
}

export interface SearchResult {
  items: Car[];
  totalCount: number;
  facets?: unknown;
  lastUpdatedAt?: string;
}

export interface SearchClient {
  search(query: SearchQuery): Promise<SearchResult>;
}

function normalizeString(value: string | undefined): string {
  return (value ?? '').trim();
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const n = Math.floor(value);
  return n > 0 ? n : fallback;
}

function computeLastUpdatedAtIso(items: Car[]): string | undefined {
  let max = 0;
  for (const item of items) {
    if (typeof item.updatedAt === 'number' && item.updatedAt > max) {
      max = item.updatedAt;
    }
  }
  return max > 0 ? new Date(max).toISOString() : undefined;
}

class MockSearchClient implements SearchClient {
  async search(query: SearchQuery): Promise<SearchResult> {
    const q = normalizeString(query.q);

    const searchParams: SearchParams = {
      q,
      maker: '',
      pref: '',
      city: '',
      minMan: normalizeString(query.minMan),
      maxMan: normalizeString(query.maxMan),
      priceChangedOnly: !!query.priceChangedOnly,
      makerSlug: normalizeString(query.makerSlug) || undefined,
      modelSlug: normalizeString(query.modelSlug) || undefined,
      prefSlug: normalizeString(query.prefSlug) || undefined,
      citySlug: normalizeString(query.citySlug) || undefined,
      featureSlug: normalizeString(query.featureSlug) || undefined,
    };

    const dataSource = new MockCarDataSource();
    const matched = searchCars(searchParams, dataSource);

    // totalCount is ALWAYS the total matched count (pre-pagination)
    const totalCount = matched.length;

    // MVP: keep pageSize fixed in code. If the caller does not request paging, return all.
    const page = query.page;
    const shouldPage = typeof page === 'number' && Number.isFinite(page) && page > 0;

    let items = matched;
    if (shouldPage) {
      const pageSize = normalizePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE);
      const start = (Math.floor(page) - 1) * pageSize;
      items = matched.slice(start, start + pageSize);
    }

    return {
      items,
      totalCount,
      lastUpdatedAt: computeLastUpdatedAtIso(matched),
    };
  }
}

class ApiSearchClient implements SearchClient {
  constructor(private readonly baseUrl: string) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const url = new URL('/search', this.baseUrl);

    // Build query params (slug-only policy)
    if (query.q) url.searchParams.set('q', query.q);
    if (query.prefSlug) url.searchParams.set('pref', query.prefSlug);
    if (query.citySlug) url.searchParams.set('city', query.citySlug);
    if (query.makerSlug) url.searchParams.set('maker', query.makerSlug);
    if (query.modelSlug) url.searchParams.set('model', query.modelSlug);
    if (query.featureSlug) url.searchParams.set('feature', query.featureSlug);
    if (query.minMan) url.searchParams.set('minMan', query.minMan);
    if (query.maxMan) url.searchParams.set('maxMan', query.maxMan);
    if (query.priceChangedOnly) url.searchParams.set('priceChangedOnly', 'true');
    if (typeof query.page === 'number' && query.page > 0) url.searchParams.set('page', String(query.page));

    // pageSize is MVP-fixed. We allow passing it (non-URL-controlled in our app),
    // but the downstream API may ignore it.
    if (typeof query.pageSize === 'number' && query.pageSize > 0) url.searchParams.set('pageSize', String(query.pageSize));
    if (query.sort) url.searchParams.set('sort', query.sort);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`ApiSearchClient failed: ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') {
      throw new Error('ApiSearchClient: invalid JSON');
    }

    const record = data as Record<string, unknown>;
    const items = Array.isArray(record.items) ? (record.items as Car[]) : [];
    const totalCount = typeof record.totalCount === 'number' ? record.totalCount : NaN;
    const lastUpdatedAt = typeof record.lastUpdatedAt === 'string' ? record.lastUpdatedAt : undefined;

    if (!Number.isFinite(totalCount)) {
      throw new Error('ApiSearchClient: totalCount is required');
    }

    return { items, totalCount, lastUpdatedAt };
  }
}

let cachedClient: SearchClient | null = null;

export function getSearchClient(): SearchClient {
  if (cachedClient) return cachedClient;

  const impl = (process.env.SEARCH_CLIENT ?? 'mock').toLowerCase();
  if (impl === 'api') {
    const baseUrl = (process.env.SEARCH_API_BASE_URL ?? '').trim();
    if (!baseUrl) {
      throw new Error('SEARCH_API_BASE_URL is required when SEARCH_CLIENT=api');
    }
    cachedClient = new ApiSearchClient(baseUrl);
    return cachedClient;
  }

  cachedClient = new MockSearchClient();
  return cachedClient;
}
