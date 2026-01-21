import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '@/components/common/Layout';
import EstimateForm from '@/components/estimate/EstimateForm';
import type { Car } from '@/types';

interface EstimatePageProps {
  car: Car | null;
  carId: string;
}

function normalizeEstimateId(raw: string): string {
  const id = raw.trim();
  // Safety: if someone passes detail-like id (d-car-000420), normalize to car-000420.
  if (id.startsWith('d-')) return id.slice(2);
  return id;
}

export const getServerSideProps: GetServerSideProps<EstimatePageProps> = async (context) => {
  const rawId = context.params?.id;
  if (typeof rawId !== 'string' || !rawId) {
    return { notFound: true };
  }

  const carId = normalizeEstimateId(rawId);

  const { getSearchClient } = await import('@/server/search/searchClient');
  const client = getSearchClient();

  const shouldLog = process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug';
  let car: Car | null = null;

  try {
    if (shouldLog) {
      console.log('[estimate] trying id filter search:', { carId });
    }
    const result = await client.search({ id: carId });
    car = result.items.find((c) => c.id === carId) || null;

    if (shouldLog) {
      console.log('[estimate] id filter result:', {
        carId,
        itemsCount: result.items.length,
        foundCar: car ? car.id : null,
      });
    }
  } catch (idFilterError) {
    if (shouldLog) {
      console.warn('[estimate] id filter failed, falling back to q search:', idFilterError);
    }

    try {
      const fallbackResult = await client.search({ q: carId });
      car = fallbackResult.items.find((c) => c.id === carId) || null;

      if (shouldLog) {
        console.log('[estimate] fallback q search result:', {
          carId,
          itemsCount: fallbackResult.items.length,
          foundCar: car ? car.id : null,
        });
      }
    } catch (fallbackError) {
      console.error('[estimate] fallback search also failed:', fallbackError);
    }
  }

  if (!car) {
    if (shouldLog) {
      console.log('[estimate] car not found, returning 404:', { carId });
    }
    return { notFound: true };
  }

  return {
    props: {
      car,
      carId,
    },
  };
};

export default function EstimatePage({ car, carId }: EstimatePageProps) {
  return (
    <Layout showFilters={false}>
      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="text-xs text-muted px-3 pt-2.5">
            <Link href="/" className="underline underline-offset-2">トップ</Link> /{' '}
            <Link href="/results" className="underline underline-offset-2">検索結果</Link> /{' '}
            <Link href={`/cars/d-${encodeURIComponent(carId)}/`} className="underline underline-offset-2">車両詳細</Link> / 見積もり申し込み
          </div>
          <EstimateForm car={car} />
        </div>
      </main>
    </Layout>
  );
}
