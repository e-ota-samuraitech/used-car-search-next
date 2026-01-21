/**
 * /results - 検索結果ページ（レガシー入口）
 *
 * - ?q=xxx でキーワード検索
 * - 昇格できるキーワードの場合は 301 リダイレクト
 * - 昇格できない場合は noindex で表示
 */

import { GetServerSideProps } from 'next';
import { useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/common/Layout';
import { SeoHead } from '@/components/seo/SeoHead';
import SearchBar from '@/components/results/SearchBar';
import ResultsList from '@/components/results/ResultsList';
import Filters from '@/components/filters/Filters';
import type { Car, SortBy } from '@/types';
import type { AbsoluteUrl, Pathname } from '@/lib/seo';
import { buildAbsoluteUrl, normalizeQueryValue, evaluateQueryUpgrade, getBaseUrl } from '@/lib/seo';
import type { SearchQuery } from '@/server/search/searchClient';
import { useApp } from '@/context/AppContext';

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
  const { req, res, query: urlQuery } = context;

  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;
  const q = normalizeQueryValue(urlQuery.q).trim();

  // 1. クエリ検索の昇格判定
  //    重要: filters が付いている場合は /results に留める（UX用URL）。
  const hasFilters =
    !!normalizeQueryValue(urlQuery.maker).trim() ||
    !!normalizeQueryValue(urlQuery.model).trim() ||
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
  const modelSlug = normalizeQueryValue(urlQuery.model).trim().toLowerCase();
  const prefSlug = normalizeQueryValue(urlQuery.pref).trim().toLowerCase();
  const citySlug = normalizeQueryValue(urlQuery.city).trim().toLowerCase();
  const featureSlug = normalizeQueryValue(urlQuery.feature).trim().toLowerCase();
  const minMan = normalizeQueryValue(urlQuery.minMan).trim();
  const maxMan = normalizeQueryValue(urlQuery.maxMan).trim();
  const priceChangedOnlyRaw = normalizeQueryValue(urlQuery.priceChangedOnly).trim().toLowerCase();
  const priceChangedOnly = priceChangedOnlyRaw === 'true' || priceChangedOnlyRaw === '1';

  const searchQuery: SearchQuery = {
    q: q || undefined,
    makerSlug: makerSlug || undefined,
    modelSlug: modelSlug || undefined,
    prefSlug: prefSlug || undefined,
    citySlug: citySlug || undefined,
    featureSlug: featureSlug || undefined,
    minMan: minMan || undefined,
    maxMan: maxMan || undefined,
    priceChangedOnly,
    // /results is UX-only; allow sort/page in future, but keep SEO noindex
  };

  const { getSearchClient } = await import('@/server/search/searchClient');
  const client = getSearchClient();
  const searchResult = await client.search(searchQuery);
  const cars = searchResult.items;

  // canonical は /cars/ へ（または null）
  const canonicalUrl = buildAbsoluteUrl(baseUrl as AbsoluteUrl, '/cars/' as Pathname);

  // dev only: expose SEO decision to response headers for debugging
  if (process.env.NODE_ENV !== 'production' || process.env.SEO_DEBUG === '1') {
    res.setHeader('x-seo-robots', 'noindex,follow');
    res.setHeader('x-seo-reason', 'QUERY_NOINDEX');
    res.setHeader('x-seo-trace', 'QUERY_NOINDEX|DECISION_NOINDEX');
  }

  return {
    props: {
      cars,
      totalCount: searchResult.totalCount,
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
    case 'relevance':
      // Preserve Vertex order (relevance). Return a copy to avoid shared mutations.
      return sorted;
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
  const router = useRouter();
  const app = useApp();
  const [sortBy, setSortBy] = useState<SortBy>('live');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);

  const sortedCars = useMemo(() => sortCars(cars, sortBy), [cars, sortBy]);

  const debugEnabled = normalizeQueryValue(router.query.debug).trim() === '1';
  const urlQ = normalizeQueryValue(router.query.q).trim();

  const didInitSort = useRef(false);

  const parseSortBy = (raw: string): SortBy | null => {
    const value = raw.trim();
    const allowed: SortBy[] = ['relevance', 'live', 'updated_desc', 'price_asc', 'price_desc'];
    return (allowed as readonly string[]).includes(value) ? (value as SortBy) : null;
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (didInitSort.current) return;
    didInitSort.current = true;

    const rawSort = normalizeQueryValue(router.query.sort).trim();
    const sortFromUrl = rawSort ? parseSortBy(rawSort) : null;

    // Priority: URL sort param > keyword search default > legacy recommended.
    if (sortFromUrl) {
      setSortBy(sortFromUrl);
      return;
    }
    if (urlQ) {
      setSortBy('relevance');
      return;
    }
    setSortBy('live');
  }, [router.isReady, router.query.sort, urlQ]);

  const renderSource: 'props' | 'context' | 'fallback' = 'props';
  const renderCars = sortedCars;

  const top3 = (list: Car[]) =>
    list.slice(0, 3).map((c) => ({ id: c.id, maker: c.maker, model: c.model }));

  useEffect(() => {
    if (!debugEnabled) return;

    const payload = {
      pathname: router.pathname,
      asPath: router.asPath,
      urlQ,
      propsQuery: query,
      propsCarsCount: cars.length,
      propsCarsTop3: top3(cars),
      sortedCarsCount: sortedCars.length,
      sortedCarsTop3: top3(sortedCars),
      ctxQuery: app.query,
      ctxResultsCount: app.results.length,
      ctxResultsTop3: top3(app.results),
      renderSource,
      renderCarsCount: renderCars.length,
      renderCarsTop3: top3(renderCars),
    };

    // eslint-disable-next-line no-console
    console.log('[DEBUG_RESULTS]', payload);
  }, [
    debugEnabled,
    router.pathname,
    router.asPath,
    urlQ,
    query,
    cars,
    sortedCars,
    app.query,
    app.results,
    renderCars,
  ]);

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
          {debugEnabled && (
            <div className="mb-3 border border-amber-300 rounded-xl bg-amber-50 p-3 text-xs text-gray-800">
              <div className="font-extrabold mb-1">DEBUG: /results</div>
              <div>pathname: {router.pathname}</div>
              <div>asPath: {router.asPath}</div>
              <div>urlQ: {urlQ || '(empty)'}</div>
              <div className="mt-2 font-extrabold">props</div>
              <div>propsCarsCount: {cars.length}</div>
              <pre className="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(top3(cars), null, 2)}</pre>
              <div className="mt-2 font-extrabold">context</div>
              <div>ctxQuery: {app.query || '(empty)'}</div>
              <div>ctxResultsCount: {app.results.length}</div>
              <pre className="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(top3(app.results), null, 2)}</pre>
              <div className="mt-2 font-extrabold">render</div>
              <div>renderSource: {renderSource}</div>
              <div>renderCarsCount: {renderCars.length}</div>
              <pre className="mt-1 whitespace-pre-wrap break-words">{JSON.stringify(top3(renderCars), null, 2)}</pre>
            </div>
          )}

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
                      <option value="relevance">関連度順</option>
                      <option value="live">おすすめ（価格変動→新規→更新）</option>
                      <option value="updated_desc">更新が新しい順</option>
                      <option value="price_asc">価格が安い順</option>
                      <option value="price_desc">価格が高い順</option>
                    </select>
                  </div>
                </div>

                {/* 検索結果リスト */}
                {sortedCars.length > 0 ? (
                  <ResultsList results={renderCars} debugEnabled={debugEnabled} debugSource={renderSource} />
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
