/**
 * /cars/d-{id}/ - 車両詳細ページ
 */

import { GetServerSideProps } from 'next';
import Layout from '@/components/common/Layout';
import { SeoHead } from '@/components/seo/SeoHead';
import type { Car } from '@/types';
import type { SeoResult } from '@/lib/seo';
import { evaluateSeo, getBaseUrl, parseUrl } from '@/lib/seo';
import { MockCarDataSource } from '@/server/search/dataSource/mockDataSource';

// ============================================
// ページProps
// ============================================

interface DetailPageProps {
  seo: SeoResult;
  car: Car | null;
  carId: string;
}

// ============================================
// getServerSideProps
// ============================================

export const getServerSideProps: GetServerSideProps<DetailPageProps> = async (context) => {
  const { req, query, params } = context;

  const carId = params?.id as string;

  if (!carId) {
    return { notFound: true };
  }

  const pathname = `/cars/d-${carId}/`;
  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;

  try {
    // 車両データを取得（mockデータから）
    const dataSource = new MockCarDataSource();
    const allCars = dataSource.getAllCars();
    const car = allCars.find((c: Car) => c.id === carId) || null;

    if (!car) {
      return { notFound: true };
    }

    const parsed = parseUrl(pathname, query);

    // 車両詳細は totalCount = 1 として扱う
    const seoResult = await evaluateSeo(
      {
        pathname: pathname as any,
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
        car,
        carId,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);

    return {
      props: {
        seo: {
          robots: 'noindex,follow',
          canonicalUrl: `${baseUrl}${pathname}` as any,
          title: '中古車詳細｜中古車情報',
          h1: '中古車詳細',
          description: '中古車の詳細情報を掲載しています。',
          urlType: 'detail',
          parsedUrl: { type: 'detail', detailId: carId, query },
        },
        car: null,
        carId,
      },
    };
  }
};

// ============================================
// ページコンポーネント
// ============================================

export default function DetailPage({ seo, car, carId }: DetailPageProps) {
  if (!car) {
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
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-8 text-center">
              <p className="text-gray-500">車両が見つかりませんでした</p>
              <a href="/cars/" className="text-accent underline mt-4 inline-block">
                中古車検索トップへ戻る
              </a>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  const priceText = car.priceYen ? `${(car.priceYen / 10000).toFixed(1)}万円` : '価格応談';

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
          {/* パンくず */}
          <div className="mb-4 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-4">
            <div className="text-xs text-muted mb-2">
              <a href="/cars/" className="underline underline-offset-2">中古車検索トップ</a>
              {' / '}
              <a href={`/cars/m-${car.maker.toLowerCase()}/`} className="underline underline-offset-2">{car.maker}</a>
              {' / '}
              {seo.h1}
            </div>
            <h1 className="text-2xl font-bold">{seo.h1}</h1>
          </div>

          {/* 車両詳細 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 左側：画像（現在は未実装） */}
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                {car.maker} {car.model}
              </div>
            </div>

            {/* 右側：詳細情報 */}
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-4">
              <div className="text-3xl font-bold text-accent mb-4">{priceText}</div>

              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-gray-500 w-1/3">メーカー</th>
                    <td className="py-2">{car.maker}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-gray-500">車種</th>
                    <td className="py-2">{car.model}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-gray-500">年式</th>
                    <td className="py-2">{car.year}年</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-gray-500">走行距離</th>
                    <td className="py-2">{car.mileage?.toLocaleString()}km</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-gray-500">地域</th>
                    <td className="py-2">{car.region} {car.pref}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-6">
                <a
                  href={`/estimate/${car.id}`}
                  className="block w-full py-3 px-4 bg-accent text-white text-center font-bold rounded-full hover:bg-accent/90 transition-colors"
                >
                  見積もりを依頼する
                </a>
              </div>

              <div className="mt-4">
                <a
                  href="/cars/"
                  className="text-accent underline text-sm"
                >
                  ← 検索結果に戻る
                </a>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
