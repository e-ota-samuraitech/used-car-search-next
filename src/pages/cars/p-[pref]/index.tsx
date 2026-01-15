/**
 * /cars/p-{pref}/ - 都道府県別中古車一覧ページ
 * SEOライブラリ統合例
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
import { evaluateSeo, getBaseUrl, parseUrl } from '@/lib/seo';
import { executeSearchFromParsedUrl } from '@/lib/search';

// ============================================
// ページProps
// ============================================

interface PrefPageProps {
  /** SEO評価結果 */
  seo: SeoResult;

  /** 検索結果 */
  cars: Car[];

  /** 総件数 */
  totalCount: number;

  /** 都道府県slug */
  prefSlug: string;
}

// ============================================
// getServerSideProps
// ============================================

export const getServerSideProps: GetServerSideProps<PrefPageProps> = async (context) => {
  const { req, query, params } = context;

  // URLパラメータから都道府県slugを取得
  const prefSlug = params?.pref as string;

  if (!prefSlug) {
    return {
      notFound: true,
    };
  }

  // 現在のパス
  const pathname = `/cars/p-${prefSlug}/`;
  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;

  try {
    // 1. URLをパース
    const parsed = parseUrl(pathname, query);

    // 2. 検索を実行して totalCount を取得
    const searchResult = await executeSearchFromParsedUrl(parsed);

    // 3. SEO評価を実行
    const seoResult = await evaluateSeo({
      pathname: pathname as any,
      query,
      totalCount: searchResult.totalCount,
      baseUrl: baseUrl as any,
    });

    // 4. 301リダイレクトが必要な場合
    if (seoResult.redirectUrl) {
      return {
        redirect: {
          destination: seoResult.redirectUrl,
          permanent: true, // 301
        },
      };
    }

    // 5. ページをレンダリング（noindexでも表示する）
    return {
      props: {
        seo: seoResult,
        cars: searchResult.items,
        totalCount: searchResult.totalCount,
        prefSlug,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    // エラー時もページは表示する（noindexで）
    return {
      props: {
        seo: {
          robots: 'noindex,follow',
          canonicalUrl: `${baseUrl}${pathname}` as any,
          title: `${prefSlug}の中古車｜最新更新順で探せる中古車一覧`,
          h1: `${prefSlug}の中古車一覧`,
          description: `${prefSlug}で販売中の中古車を最新更新順で掲載。条件別に在庫を確認できます。`,
          urlType: 'pref',
          parsedUrl: { type: 'pref', prefSlug, query },
        },
        cars: [],
        totalCount: 0,
        prefSlug,
      },
    };
  }
};

// ============================================
// ページコンポーネント
// ============================================

export default function PrefPage({ seo, cars, totalCount, prefSlug }: PrefPageProps) {
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

      <Layout showFilters={false}>
        <div className="w-full">
          {/* ページ上部 */}
          <div className="mb-4 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-4">
            <div className="text-xs text-muted mb-2">
              <a href="/cars/" className="underline underline-offset-2">中古車検索トップ</a> / {seo.h1}
            </div>
            <h1 className="text-2xl font-bold mb-3">{seo.h1}</h1>
            <p className="text-gray-600 mb-4 text-sm">{seo.description}</p>
            <SearchBar variant="compact" />
          </div>

          {/* メインコンテンツエリア */}
          <div className={`grid grid-cols-1 gap-3.5 ${isFilterSidebarOpen ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
            {/* 左側：検索結果 */}
            <main>
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                {/* ツールバー */}
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

                {/* 検索結果リスト */}
                {cars.length > 0 ? (
                  <ResultsList results={cars} />
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
