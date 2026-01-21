import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '@/components/common/Layout';
import ResultsList from '@/components/results/ResultsList';
import { SeoHead } from '@/components/seo/SeoHead';
import type { Car } from '@/types';
import { decodeShopSlug } from '@/lib/shops/slug';
import { getBaseUrl } from '@/lib/seo';

interface ShopInventoryPageProps {
  shopName: string;
  shopSlug: string;
  cars: Car[];
  totalCount: number;
  canonicalUrl: string;
}

export const getServerSideProps: GetServerSideProps<ShopInventoryPageProps> = async (context) => {
  const { req, params } = context;

  const rawSlug = typeof params?.shopSlug === 'string' ? params.shopSlug : '';
  if (!rawSlug) return { notFound: true };

  let shopName: string;
  try {
    shopName = decodeShopSlug(rawSlug).trim();
  } catch {
    return { notFound: true };
  }

  if (!shopName) return { notFound: true };

  const { getSearchClient } = await import('@/server/search/searchClient');
  const client = getSearchClient();

  const pageSize = 200;

  const impl = (process.env.SEARCH_CLIENT ?? 'mock').toLowerCase();

  // 1st: try filter-based (Vertex only). If it fails or returns 0, fallback to q-search.
  let items: Car[] = [];
  let totalCount = 0;

  if (impl === 'vertex') {
    try {
      const r = await client.search({ shop: shopName, pageSize });
      const filtered = r.items.filter((c) => c.shop === shopName);

      if (filtered.length > 0) {
        items = filtered;
        totalCount = filtered.length;
      }
    } catch {
      // ignore and fallback
    }
  }

  if (items.length === 0) {
    const r = await client.search({ q: shopName, pageSize });
    const filtered = r.items.filter((c) => c.shop === shopName);
    items = filtered;
    totalCount = filtered.length;
  }

  const baseUrl = getBaseUrl() || `http://${req.headers.host || 'localhost'}`;
  const canonicalUrl = `${String(baseUrl).replace(/\/$/, '')}/shops/${rawSlug}/`;

  return {
    props: {
      shopName,
      shopSlug: rawSlug,
      cars: items,
      totalCount,
      canonicalUrl,
    },
  };
};

export default function ShopInventoryPage({ shopName, cars, totalCount, canonicalUrl }: ShopInventoryPageProps) {
  return (
    <Layout>
      <SeoHead
        title={`${shopName}の在庫一覧`}
        description={`${shopName}の在庫一覧（${totalCount}件）`}
        robots="noindex,follow"
        canonicalUrl={canonicalUrl}
      />

      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="text-xs text-muted px-3 pt-2.5">
            <Link href="/" className="underline underline-offset-2">トップ</Link> /{' '}
            <Link href="/results" className="underline underline-offset-2">検索結果</Link> / 店舗
          </div>

          <div className="p-3">
            <h1 className="m-0 text-base font-extrabold">{shopName}</h1>
            <div className="mt-1 text-xs text-muted">この店舗の在庫一覧（{totalCount}件）</div>
          </div>

          <ResultsList results={cars} />
        </div>
      </main>
    </Layout>
  );
}
