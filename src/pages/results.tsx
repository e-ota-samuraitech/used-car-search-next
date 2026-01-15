/**
 * /results - 検索結果ページ（レガシー入口）
 *
 * - ?q=xxx でキーワード検索
 * - 昇格できるキーワードの場合は 301 リダイレクト
 * - 昇格できない場合は noindex で表示
 */

import { GetServerSideProps } from 'next';
import { useState, ChangeEvent } from 'react';
import Link from 'next/link';
import Layout from '@/components/common/Layout';
import { SeoHead } from '@/components/seo/SeoHead';
import SearchBar from '@/components/results/SearchBar';
import ResultsList from '@/components/results/ResultsList';
import Filters from '@/components/filters/Filters';
import type { Car, SortBy } from '@/types';
import type { AbsoluteUrl, Pathname } from '@/lib/seo';
import { buildAbsoluteUrl, normalizeQueryValue, evaluateQueryUpgrade, getBaseUrl } from '@/lib/seo';
import { searchCars } from '@/server/search/searchService';
import { MockCarDataSource } from '@/server/search/dataSource/mockDataSource';

// ============================================
// ページProps
// ============================================

interface ResultsPageProps {
  cars: Car[];
  totalCount: number;
  query: string;
  canonicalUrl: string | null;
}

// ============================================
// getServerSideProps
// ============================================

export const getServerSideProps: GetServerSideProps<ResultsPageProps> = async (context) => {
  const { req, query: urlQuery } = context;

  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;
  const q = normalizeQueryValue(urlQuery.q).trim();

  // 1. クエリ検索の昇格判定
  //    重要: filters が付いている場合は /results に留める（UX用URL）。
  const hasFilters =
    !!normalizeQueryValue(urlQuery.maker).trim() ||
    !!normalizeQueryValue(urlQuery.pref).trim() ||
    !!normalizeQueryValue(urlQuery.city).trim() ||
    !!normalizeQueryValue(urlQuery.feature).trim() ||
    !!normalizeQueryValue(urlQuery.minMan).trim() ||
    !!normalizeQueryValue(urlQuery.maxMan).trim() ||
    ['true', '1'].includes(normalizeQueryValue(urlQuery.priceChangedOnly).trim().toLowerCase());

  if (q && !hasFilters) {
    const upgrade = evaluateQueryUpgrade({ q });

    if (upgrade.canUpgrade && upgrade.upgradePath) {
      // 昇格できる → 301 リダイレクト
      return {
        redirect: {
          destination: upgrade.upgradePath,
          permanent: true, // 301
        },
      };
    }
  }

  // 2. 昇格できない → 検索を実行して表示（noindex）
  const makerSlug = normalizeQueryValue(urlQuery.maker).trim().toLowerCase();
  const prefSlug = normalizeQueryValue(urlQuery.pref).trim().toLowerCase();
  const citySlug = normalizeQueryValue(urlQuery.city).trim().toLowerCase();
  const featureSlug = normalizeQueryValue(urlQuery.feature).trim().toLowerCase();
  const minMan = normalizeQueryValue(urlQuery.minMan).trim();
  const maxMan = normalizeQueryValue(urlQuery.maxMan).trim();
  const priceChangedOnlyRaw = normalizeQueryValue(urlQuery.priceChangedOnly).trim().toLowerCase();
  const priceChangedOnly = priceChangedOnlyRaw === 'true' || priceChangedOnlyRaw === '1';

  const searchParams = {
    q: q || '',
    maker: '',
    pref: '',
    city: '',
    minMan,
    maxMan,
    priceChangedOnly,
    makerSlug: makerSlug || undefined,
    prefSlug: prefSlug || undefined,
    citySlug: citySlug || undefined,
    featureSlug: featureSlug || undefined,
  };

  const dataSource = new MockCarDataSource();
  const cars = searchCars(searchParams, dataSource);

  // canonical は /cars/ へ（または null）
  const canonicalUrl = buildAbsoluteUrl(baseUrl as AbsoluteUrl, '/cars/' as Pathname);

  return {
    props: {
      cars,
      totalCount: cars.length,
      query: q,
      canonicalUrl,
    },
  };
};

// ============================================
// ソート関数
// ============================================

function sortCars(cars: Car[], sortBy: SortBy): Car[] {
  const sorted = [...cars];
  const now = Date.now();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => (a.priceYen || 0) - (b.priceYen || 0));
    case 'price_desc':
      return sorted.sort((a, b) => (b.priceYen || 0) - (a.priceYen || 0));
    case 'updated_desc':
      return sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    case 'live':
    default:
      // おすすめ順：価格変動 → 新規 → 更新
      return sorted.sort((a, b) => {
        const aHasPriceChange = a.priceChangedAt !== null;
        const bHasPriceChange = b.priceChangedAt !== null;
        const aIsNew = (now - a.postedAt) < ONE_WEEK;
        const bIsNew = (now - b.postedAt) < ONE_WEEK;

        if (aHasPriceChange && !bHasPriceChange) return -1;
        if (!aHasPriceChange && bHasPriceChange) return 1;
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }
}

// ============================================
// ページコンポーネント
// ============================================

export default function ResultsPage({ cars, totalCount, query, canonicalUrl }: ResultsPageProps) {
  const [sortBy, setSortBy] = useState<SortBy>('live');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);

  const sortedCars = sortCars(cars, sortBy);

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortBy);
  };

  return (
    <>
      <SeoHead
        robots="noindex,follow"
        canonicalUrl={canonicalUrl || undefined}
        title={query ? `「${query}」の検索結果｜中古車検索` : '検索結果｜中古車検索'}
        description={query ? `「${query}」の中古車検索結果を表示しています。` : '中古車の検索結果を表示しています。'}
      />

      <Layout showFilters={false}>
        <div className="w-full">
          {/* ページ上部の検索バー */}
          <div className="mb-3 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-3">
            <div className="text-xs text-muted mb-2">
              <Link href="/" className="underline underline-offset-2">トップ</Link>
              {' / '}
              <a href="/cars/" className="underline underline-offset-2">中古車検索</a>
              {' / '}
              検索結果
              {query && ` 「${query}」`}
            </div>
            <SearchBar variant="compact" />
          </div>

          {/* スマホ版：絞り込み欄（折りたたみ式） */}
          <div className="mb-3 lg:hidden">
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-sm font-medium">絞り込み検索</span>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${isMobileFilterOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMobileFilterOpen && (
                <div className="border-t border-gray-200">
                  <Filters isOpen={true} />
                </div>
              )}
            </div>
          </div>

          {/* メインコンテンツエリア */}
          <div className={`grid grid-cols-1 gap-3.5 ${isFilterSidebarOpen ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
            {/* 左側：検索結果 */}
            <main>
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                {/* ツールバー */}
                <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 border-b border-gray-200 bg-white flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                      className="hidden lg:flex h-[34px] px-3 rounded-full border border-gray-200 bg-white cursor-pointer items-center gap-1.5 hover:bg-gray-50 transition-colors text-sm"
                      type="button"
                    >
                      {isFilterSidebarOpen ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>閉じる</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          <span>絞り込み</span>
                        </>
                      )}
                    </button>
                    <div className="text-xs text-gray-600">検索結果 {totalCount}件</div>
                  </div>
                  <div className="flex gap-2.5">
                    <select
                      value={sortBy}
                      onChange={handleSortChange}
                      aria-label="並び替え"
                      className="h-[34px] border border-gray-200 rounded-full px-2.5 bg-white text-sm"
                    >
                      <option value="live">おすすめ（価格変動→新規→更新）</option>
                      <option value="updated_desc">更新が新しい順</option>
                      <option value="price_asc">価格が安い順</option>
                      <option value="price_desc">価格が高い順</option>
                    </select>
                  </div>
                </div>

                {/* 検索結果リスト */}
                {sortedCars.length > 0 ? (
                  <ResultsList results={sortedCars} />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    該当する車両が見つかりませんでした
                  </div>
                )}
              </div>
            </main>

            {/* 右側：絞り込みフィルター */}
            <aside className="hidden lg:block">
              <Filters isOpen={isFilterSidebarOpen} />
            </aside>
          </div>
        </div>
      </Layout>
    </>
  );
}
