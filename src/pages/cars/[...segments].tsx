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
import SearchBar from '@/components/results/SearchBar';
import ResultsList from '@/components/results/ResultsList';
import Filters from '@/components/filters/Filters';
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
import { MockCarDataSource } from '@/server/search/dataSource/mockDataSource';

interface CatchAllCarsPageProps {
  seo: SeoResult;
  cars: Car[];
  totalCount: number;
  pathname: string;
  car?: Car | null;
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
    return (
      (isPref(a) && isCity(b) && isMaker(c)) ||
      (isPref(a) && isMaker(b) && isModel(c))
    );
  }

  return false;
}

export const getServerSideProps: GetServerSideProps<CatchAllCarsPageProps> = async (context) => {
  const { req, query, params } = context;

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

    // detail はここで確実に表示する
    if (parsed.type === 'detail' && parsed.detailId) {
      const dataSource = new MockCarDataSource();
      const car = dataSource.getAllCars().find((c: Car) => c.id === parsed.detailId) || null;
      if (!car) {
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

      return {
        props: {
          seo: seoResult,
          cars: [],
          totalCount: 1,
          pathname,
          car,
        },
      };
    }

    const searchResult = await executeSearchFromParsedUrl(parsed);

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

    return {
      props: {
        seo: seoResult,
        cars: searchResult.items,
        totalCount: searchResult.totalCount,
        pathname,
        car: null,
      },
    };
  } catch (error) {
    console.error('Error in /cars catch-all getServerSideProps:', error);

    // 仕様方針としては「未知は404寄り」。SSR例外も404扱いに寄せる。
    return { notFound: true };
  }
};

export default function CatchAllCarsPage({ seo, cars, totalCount, car }: CatchAllCarsPageProps) {
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);

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
              <div className="text-xs text-muted px-3 pt-2.5">
                <a href="/cars/" className="underline underline-offset-2">中古車検索トップ</a> / 車両詳細
              </div>
              <CarDetail car={car ?? null} />
            </div>
          </main>
        </Layout>
      </>
    );
  }

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
              <a href="/cars/" className="underline underline-offset-2">中古車検索トップ</a> / {seo.h1}
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
                  <div className="p-8 text-center text-gray-500">該当する車両が見つかりませんでした</div>
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
