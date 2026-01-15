/**
 * /cars/f-{feature}/ - feature別中古車一覧ページ
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
// feature slug → 表示名
// ============================================

const FEATURE_SLUG_TO_NAME: Record<string, string> = {
  '4wd': '4WD（四駆）',
  'hybrid': 'ハイブリッド',
  'mt': 'MT（マニュアル）',
  'diesel': 'ディーゼル',
  'suv': 'SUV',
  'minivan': 'ミニバン',
  'kei': '軽自動車',
  'wagon': 'ワゴン',
  'sedan': 'セダン',
  'hatchback': 'ハッチバック',
};

function featureSlugToName(slug: string): string {
  return FEATURE_SLUG_TO_NAME[slug] || slug;
}

// ============================================
// ページProps
// ============================================

interface FeaturePageProps {
  seo: SeoResult;
  cars: Car[];
  totalCount: number;
  featureSlug: string;
  featureName: string;
}

// ============================================
// getServerSideProps
// ============================================

export const getServerSideProps: GetServerSideProps<FeaturePageProps> = async (context) => {
  const { req, query, params } = context;

  const featureSlug = params?.feature as string;

  if (!featureSlug) {
    return { notFound: true };
  }

  const pathname = `/cars/f-${featureSlug}/`;
  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;
  const featureName = featureSlugToName(featureSlug);

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
        featureSlug,
        featureName,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    return {
      props: {
        seo: {
          robots: 'noindex,follow',
          canonicalUrl: `${baseUrl}${pathname}` as any,
          title: `${featureName}中古車｜最新更新順で探せる中古車`,
          h1: `${featureName}の中古車一覧`,
          description: `${featureName}の中古車を最新更新順で掲載しています。`,
          urlType: 'feature',
          parsedUrl: { type: 'feature', featureSlug, query },
        },
        cars: [],
        totalCount: 0,
        featureSlug,
        featureName,
      },
    };
  }
};

// ============================================
// ページコンポーネント
// ============================================

export default function FeaturePage({ seo, cars, totalCount, featureName }: FeaturePageProps) {
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
