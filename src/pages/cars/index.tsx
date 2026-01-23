/**
 * /cars/ - 中古車検索トップページ
 * SEOライブラリ統合例
 */

import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Layout from '@/components/common/Layout';
import { SeoHead } from '@/components/seo/SeoHead';
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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  return (
    <>
      {/* SEO meta tags */}
      <SeoHead
        title={seo.title}
        description={seo.description}
        canonicalUrl={seo.canonicalUrl}
        robots={seo.robots}
      />

      <Layout showFilters={false} contentClassName="max-w-none mx-0 p-0" topbarVariant="search">
        {/* スマホ版：絞り込み欄（折りたたみ式） */}
        <div className="md:hidden px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap text-sm"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            絞り込み
          </button>
          {isMobileFilterOpen && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
              <Filters isOpen={true} />
            </div>
          )}
        </div>

        <ResultsShell
          left={<Filters isOpen={true} />}
          right={<CampaignSidebar />}
        >
          {/* 結果件数 */}
          <div className="text-xs md:text-sm text-gray-600 mb-4">
            約 {totalCount} 件の結果
          </div>

          <ResultsList results={cars} cardVariant="vertical" />
        </ResultsShell>
      </Layout>
    </>
  );
}
