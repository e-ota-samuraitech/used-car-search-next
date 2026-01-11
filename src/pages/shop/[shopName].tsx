import { useRouter } from 'next/router';
import { ChangeEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/common/Layout';
import ShopDetail from '@/components/shop/ShopDetail';
import { useApp } from '@/context/AppContext';
import type { SortBy } from '@/types';

export default function ShopPage() {
  const router = useRouter();
  const { shopName } = router.query;
  const { findCarsByShop, findShopByName, sortBy, setSortBy, applySort } = useApp();

  const decodedShopName = typeof shopName === 'string' ? decodeURIComponent(shopName) : '';
  const shop = findShopByName(decodedShopName);
  const carsRaw = findCarsByShop(decodedShopName);

  const [cars, setCars] = useState(applySort(carsRaw));

  useEffect(() => {
    setCars(applySort(carsRaw));
  }, [sortBy, decodedShopName]);

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value as SortBy;
    setSortBy(newSortBy);
  };

  return (
    <Layout>
      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="text-xs text-muted px-3 pt-2.5">
            <Link href="/" className="underline underline-offset-2">トップ</Link> /{' '}
            <Link href="/results" className="underline underline-offset-2">検索結果</Link> / 店舗詳細
          </div>
          <ShopDetail
            shop={shop}
            cars={cars}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />
        </div>
      </main>
    </Layout>
  );
}
