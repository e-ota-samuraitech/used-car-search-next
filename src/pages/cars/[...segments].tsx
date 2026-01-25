/**
 * /cars/[...segments] - catch-all
 *
 * 未実装の /cars/... 構造をここで受け、
 * - URL（接頭辞方式）の厳格バリデーション
 * - SSR検索で totalCount 取得
 * - SEO判定（evaluateSeo）
 * を一元的に行う。
 *
 * 既存の個別ページ（/cars/, /cars/p-[pref]/, /cars/m-[maker]/ など）が優先され、
 * このcatch-allは「未実装ルート」だけを拾う。
 */

import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Layout from '@/components/common/Layout';
import { SeoHead } from '@/components/seo/SeoHead';
import ResultsList from '@/components/results/ResultsList';
import FiltersSidebar from '@/components/filters/FiltersSidebar';
import ResultsShell from '@/components/results/ResultsShell';
import CampaignSidebar from '@/components/results/CampaignSidebar';
import CarDetail from '@/components/detail/CarDetail';
import type { Car } from '@/types';
import type { SeoResult, ParsedUrl, Pathname } from '@/lib/seo';
import {
  evaluateSeo,
  getBaseUrl,
  parseUrl,
  buildCanonicalPath,
  buildAbsoluteUrl,
  isValidSlug,
} from '@/lib/seo';
import { executeSearchFromParsedUrl } from '@/lib/search';
import { getSearchClient } from '@/server/search/searchClient';
import type { Facet } from '@/server/search/searchClient';
import type { FeatureContent } from '@/lib/seo/featureContent';
import { getFeatureContent } from '@/lib/seo/featureContent';

function shouldEmitSeoDebugHeaders(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.SEO_DEBUG === '1';
}

function setSeoDebugHeaders(
  res: Parameters<GetServerSideProps>[0]['res'],
  seo: SeoResult
): void {
  if (!shouldEmitSeoDebugHeaders()) return;
  res.setHeader('x-seo-robots', seo.robots);
  res.setHeader('x-seo-reason', seo.reasonPrimary);
  const joined = seo.reasonTrace.join('|');
  const maxLen = 900;
  const value = joined.length > maxLen ? `${joined.slice(0, maxLen - 3)}...` : joined;
  res.setHeader('x-seo-trace', value);
}

interface CatchAllCarsPageProps {
  seo: SeoResult;
  cars: Car[];
  totalCount: number;
  pathname: string;
  car?: Car | null;
  featureContent?: FeatureContent | null;
  facets: Facet[];
}

type SegmentsParam = string[] | string | undefined;

function asArray(value: SegmentsParam): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isPref(seg: string): boolean {
  return seg.startsWith('p-');
}

function isCity(seg: string): boolean {
  return seg.startsWith('c-');
}

function isMaker(seg: string): boolean {
  return seg.startsWith('m-');
}

function isModel(seg: string): boolean {
  return seg.startsWith('s-');
}

function isFeature(seg: string): boolean {
  return seg.startsWith('f-');
}

function isDetail(seg: string): boolean {
  return seg.startsWith('d-');
}

function extractSlug(seg: string): string {
  const idx = seg.indexOf('-');
  return idx >= 0 ? seg.slice(idx + 1) : '';
}

function isValidSegment(seg: string): boolean {
  // 拡張子や空は拒否
  if (!seg || seg.includes('.')) return false;

  // 接頭辞は必須
  if (!/^[pcdmsf]-/.test(seg)) return false;

  const slug = extractSlug(seg);
  return !!slug && isValidSlug(slug);
}

function isValidCarsSegments(segments: string[]): boolean {
  // /cars/ 自体は個別ページが担当（catch-allでは404寄せ）
  if (segments.length === 0) return false;

  // セグメント単体バリデーション
  if (!segments.every(isValidSegment)) return false;

  // detail は catch-all でも確実に受ける（ルーティング吸い込み対策）
  if (segments.length === 1 && isDetail(segments[0])) return true;

  if (segments.length === 1) {
    return isPref(segments[0]) || isMaker(segments[0]) || isFeature(segments[0]);
  }

  if (segments.length === 2) {
    const [a, b] = segments;
    return (
      (isMaker(a) && isModel(b)) ||
      (isPref(a) && isCity(b)) ||
      (isPref(a) && isMaker(b)) ||
      (isPref(a) && isFeature(b))
    );
  }

  if (segments.length === 3) {
    const [a, b, c] = segments;
    return isPref(a) && isCity(b) && isMaker(c);
  }

  return false;
}

export const getServerSideProps: GetServerSideProps<CatchAllCarsPageProps> = async (context) => {
  const { req, res, query, params } = context;

  const segments = asArray(params?.segments as SegmentsParam);

  if (!isValidCarsSegments(segments)) {
    return { notFound: true };
  }

  const pathname = (`/cars/${segments.join('/')}/` as unknown) as Pathname;
  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;

  try {
    const parsed: ParsedUrl = parseUrl(pathname, query);

    // 正規URLへ集約（可能なら301/308で寄せる）
    const canonicalPath = buildCanonicalPath(parsed);
    if (canonicalPath && canonicalPath !== pathname) {
      return {
        redirect: {
          destination: buildAbsoluteUrl(baseUrl, canonicalPath),
          permanent: true,
        },
      };
    }

    // detail はここで確実に表示する（Vertex から取得）
    if (parsed.type === 'detail' && parsed.detailId) {
      const detailId = parsed.detailId;
      const client = getSearchClient();
      let car: Car | null = null;
      let usedFallback = false;

      // デバッグログ用
      const shouldLog = process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug';

      try {
        // 第一候補: id フィルタで1件取得
        if (shouldLog) {
          console.log('[detail] trying id filter search:', { detailId });
        }
        const result = await client.search({ id: detailId });
        car = result.items.find(c => c.id === detailId) || null;

        if (shouldLog) {
          console.log('[detail] id filter result:', {
            detailId,
            itemsCount: result.items.length,
            foundCar: car ? car.id : null,
          });
        }
      } catch (idFilterError) {
        // id フィルタが INVALID_ARGUMENT 等で失敗 → q 検索にフォールバック
        if (shouldLog) {
          console.warn('[detail] id filter failed, falling back to q search:', idFilterError);
        }
        usedFallback = true;

        try {
          const fallbackResult = await client.search({ q: detailId });
          car = fallbackResult.items.find(c => c.id === detailId) || null;

          if (shouldLog) {
            console.log('[detail] fallback q search result:', {
              detailId,
              itemsCount: fallbackResult.items.length,
              foundCar: car ? car.id : null,
            });
          }
        } catch (fallbackError) {
          console.error('[detail] fallback search also failed:', fallbackError);
        }
      }

      if (!car) {
        if (shouldLog) {
          console.log('[detail] car not found, returning 404:', { detailId, usedFallback });
        }
        return { notFound: true };
      }

      const seoResult = await evaluateSeo(
        {
          pathname,
          query,
          totalCount: 1,
          baseUrl: baseUrl as any,
        },
        {
          carData: {
            maker: car.maker,
            model: car.model,
            grade: '',
            price: car.priceYen,
          },
        }
      );

      setSeoDebugHeaders(res, seoResult);

      return {
        props: {
          seo: seoResult,
          cars: [],
          totalCount: 1,
          pathname,
          car,
          facets: [],
        },
      };
    }

    const searchResult = await executeSearchFromParsedUrl(parsed);

    const featureContent =
      parsed.type === 'feature' || parsed.type === 'pref-feature'
        ? getFeatureContent(parsed.featureSlug)
        : null;

    const seoResult = await evaluateSeo({
      pathname,
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

    setSeoDebugHeaders(res, seoResult);

    return {
      props: {
        seo: seoResult,
        cars: searchResult.items,
        totalCount: searchResult.totalCount,
        pathname,
        car: null,
        featureContent,
        facets: searchResult.facets,
      },
    };
  } catch (error) {
    console.error('Error in /cars catch-all getServerSideProps:', error);

    // 仕様方針としては「未知は404寄り」。SSR例外も404扱いに寄せる。
    return { notFound: true };
  }
};

export default function CatchAllCarsPage({ seo, cars, totalCount, car, featureContent, facets }: CatchAllCarsPageProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 車両詳細ページ（detail分岐）は現状維持
  if (seo.urlType === 'detail') {
    return (
      <>
        <SeoHead
          title={seo.title}
          description={seo.description}
          canonicalUrl={seo.canonicalUrl}
          robots={seo.robots}
        />
        <Layout showFilters={false}>
          <main>
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <CarDetail car={car ?? null} />
            </div>
          </main>
        </Layout>
      </>
    );
  }

  // 検索一覧ページ（readdy準拠）
  return (
    <>
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
              <FiltersSidebar facets={facets} isOpen={true} />
            </div>
          )}
        </div>

        <ResultsShell
          left={<FiltersSidebar facets={facets} isOpen={true} />}
          right={<CampaignSidebar />}
        >
          {/* 結果件数 */}
          <div className="text-xs md:text-sm text-gray-600 mb-4">
            約 {totalCount} 件の結果
          </div>

          {cars.length > 0 ? (
            <ResultsList results={cars} cardVariant="vertical" />
          ) : (
            <div className="text-center py-16">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm md:text-base text-gray-600">該当する車両が見つかりませんでした</p>
            </div>
          )}
        </ResultsShell>
      </Layout>
    </>
  );
}
