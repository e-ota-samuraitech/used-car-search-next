/**
 * /cars/ - 中古車検索トップページ
 * SEOライブラリ統合例
 */

import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Layout from '@/components/common/Layout';
import { SeoHead } from '@/components/seo/SeoHead';
import SearchBar from '@/components/results/SearchBar';
import ResultsList from '@/components/results/ResultsList';
import Filters from '@/components/filters/Filters';
import ResultsShell from '@/components/results/ResultsShell';
import CampaignSidebar from '@/components/results/CampaignSidebar';
import type { Car } from '@/types';
import type { SeoResult } from '@/lib/seo';
import { evaluateSeo, getBaseUrl } from '@/lib/seo';
import { executeSearchFromParsedUrl } from '@/lib/search';

function shouldEmitSeoDebugHeaders(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.SEO_DEBUG === '1';
}

function setSeoDebugHeaders(res: Parameters<GetServerSideProps>[0]['res'], seo: SeoResult): void {
  if (!shouldEmitSeoDebugHeaders()) return;
  res.setHeader('x-seo-robots', seo.robots);
  res.setHeader('x-seo-reason', seo.reasonPrimary);

  const joined = seo.reasonTrace.join('|');
  const maxLen = 900;
  const value = joined.length > maxLen ? `${joined.slice(0, maxLen - 3)}...` : joined;
  res.setHeader('x-seo-trace', value);
}

// ============================================
// ページProps
// ============================================

interface CarsTopPageProps {
  /** SEO評価結果 */
  seo: SeoResult;

  /** 検索結果 */
  cars: Car[];

  /** 総件数 */
  totalCount: number;
}

// ============================================
// getServerSideProps
// ============================================

export const getServerSideProps: GetServerSideProps<CarsTopPageProps> = async (context) => {
  const { req, res, query } = context;

  // 現在のパスとクエリ
  const pathname = '/cars/';
  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;

  try {
    // 1. 検索を実行して totalCount を取得
    const searchResult = await executeSearchFromParsedUrl({
      type: 'cars-top',
      query,
    });

    // 2. SEO評価を実行
    const seoResult = await evaluateSeo({
      pathname: pathname as any,
      query,
      totalCount: searchResult.totalCount,
      baseUrl: baseUrl as any,
    });

    // 3. 301リダイレクトが必要な場合
    if (seoResult.redirectUrl) {
      return {
        redirect: {
          destination: seoResult.redirectUrl,
          permanent: true, // 301
        },
      };
    }

    // 4. ページをレンダリング
    setSeoDebugHeaders(res, seoResult);
    return {
      props: {
        seo: seoResult,
        cars: searchResult.items,
        totalCount: searchResult.totalCount,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    const fallbackSeo: SeoResult = {
      robots: 'noindex,follow',
      reasonPrimary: 'QUERY_NOINDEX',
      reasonTrace: ['QUERY_NOINDEX', 'DECISION_NOINDEX'],
      canonicalUrl: `${baseUrl}${pathname}` as any,
      title: '中古車検索｜更新が早い中古車情報',
      h1: '更新が早い中古車検索',
      description: '更新が早い中古車情報をまとめて検索。全国の最新在庫を条件別に探せます。',
      urlType: 'cars-top',
      parsedUrl: { type: 'cars-top', query },
    };

    // エラー時もページは表示する（noindexで）
    setSeoDebugHeaders(res, fallbackSeo);
    return {
      props: {
        seo: fallbackSeo,
        cars: [],
        totalCount: 0,
      },
    };
  }
};

// ============================================
// ページコンポーネント
// ============================================

export default function CarsTopPage({ seo, cars, totalCount }: CarsTopPageProps) {
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);

  return (
    <>
      {/* SEO meta tags */}
      <SeoHead
        title={seo.title}
        description={seo.description}
        canonicalUrl={seo.canonicalUrl}
        robots={seo.robots}
      />

      <Layout showFilters={false} contentClassName="max-w-none mx-0 p-0">
        <div className="w-full">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-4 md:py-6">
            {/* ページ上部 */}
            <div className="mb-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-6">
              <h1 className="text-2xl font-bold mb-4">{seo.h1}</h1>
              <p className="text-gray-600 mb-4">{seo.description}</p>
              <SearchBar variant="large" />
            </div>
          </div>

          <ResultsShell
            left={isFilterSidebarOpen ? <Filters isOpen={true} /> : null}
            right={<CampaignSidebar />}
          >
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 0 00-.293.707V17l-4 4v-6.586a1 0 00-.293-.707L3.293 7.293A1 0 013 6.586V4z" />
                        </svg>
                        <span>絞り込み</span>
                      </>
                    )}
                  </button>
                  <div className="text-xs text-gray-600">検索結果 {totalCount}件</div>
                </div>
              </div>

              <ResultsList results={cars} />
            </div>
          </ResultsShell>
        </div>
      </Layout>
    </>
  );
}
