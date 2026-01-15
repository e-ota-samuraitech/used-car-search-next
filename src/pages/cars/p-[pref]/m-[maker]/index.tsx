/**
 * /cars/p-{pref}/m-{maker}/ - 都道府県×メーカー別中古車一覧ページ
 */

import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Layout from '@/components/common/Layout';
import { SeoHead } from '@/components/seo/SeoHead';
import SearchBar from '@/components/results/SearchBar';
import ResultsList from '@/components/results/ResultsList';
import Filters from '@/components/filters/Filters';
import type { Car } from '@/types';
import type { SeoResult } from '@/lib/seo';
import { evaluateSeo, getBaseUrl, parseUrl, prefSlugToName, makerSlugToName } from '@/lib/seo';
import { executeSearchFromParsedUrl } from '@/lib/search';

// ============================================
// ページProps
// ============================================

interface PrefMakerPageProps {
  seo: SeoResult;
  cars: Car[];
  totalCount: number;
  prefSlug: string;
  makerSlug: string;
  prefName: string;
  makerName: string;
}

// ============================================
// getServerSideProps
// ============================================

export const getServerSideProps: GetServerSideProps<PrefMakerPageProps> = async (context) => {
  const { req, query, params } = context;

  const prefSlug = params?.pref as string;
  const makerSlug = params?.maker as string;

  if (!prefSlug || !makerSlug) {
    return { notFound: true };
  }

  const pathname = `/cars/p-${prefSlug}/m-${makerSlug}/`;
  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;
  const prefName = prefSlugToName(prefSlug);
  const makerName = makerSlugToName(makerSlug);

  try {
    const parsed = parseUrl(pathname, query);
    const searchResult = await executeSearchFromParsedUrl(parsed);

    const seoResult = await evaluateSeo({
      pathname: pathname as any,
      query,
      totalCount: searchResult.totalCount,
      baseUrl: baseUrl as any,
    });

    if (seoResult.redirectUrl) {
      return {
        redirect: {
          destination: seoResult.redirectUrl,
          permanent: true,
        },
      };
    }

    return {
      props: {
        seo: seoResult,
        cars: searchResult.items,
        totalCount: searchResult.totalCount,
        prefSlug,
        makerSlug,
        prefName,
        makerName,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    return {
      props: {
        seo: {
          robots: 'noindex,follow',
          canonicalUrl: `${baseUrl}${pathname}` as any,
          title: `${prefName}の${makerName}中古車｜最新更新順で探せる中古車一覧`,
          h1: `${prefName}の${makerName}中古車一覧`,
          description: `${prefName}で販売中の${makerName}中古車を最新更新順で掲載。条件別に在庫を確認できます。`,
          urlType: 'pref-maker',
          parsedUrl: { type: 'pref-maker', prefSlug, makerSlug, query },
        },
        cars: [],
        totalCount: 0,
        prefSlug,
        makerSlug,
        prefName,
        makerName,
      },
    };
  }
};

// ============================================
// ページコンポーネント
// ============================================

export default function PrefMakerPage({ seo, cars, totalCount, prefName, makerName }: PrefMakerPageProps) {
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);

  return (
    <>
      <SeoHead
        title={seo.title}
        description={seo.description}
        canonicalUrl={seo.canonicalUrl}
        robots={seo.robots}
      />

      <Layout showFilters={false}>
        <div className="w-full">
          <div className="mb-4 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-4">
            <div className="text-xs text-muted mb-2">
              <a href="/cars/" className="underline underline-offset-2">中古車検索トップ</a>
              {' / '}
              <a href={`/cars/p-${prefName}/`} className="underline underline-offset-2">{prefName}</a>
              {' / '}
              {seo.h1}
            </div>
            <h1 className="text-2xl font-bold mb-3">{seo.h1}</h1>
            <p className="text-gray-600 mb-4 text-sm">{seo.description}</p>
            <SearchBar variant="compact" />
          </div>

          <div className={`grid grid-cols-1 gap-3.5 ${isFilterSidebarOpen ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
            <main>
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 border-b border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
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
                </div>

                {cars.length > 0 ? (
                  <ResultsList results={cars} />
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    該当する車両が見つかりませんでした
                  </div>
                )}
              </div>
            </main>

            <aside className="hidden lg:block">
              <Filters isOpen={isFilterSidebarOpen} />
            </aside>
          </div>
        </div>
      </Layout>
    </>
  );
}
