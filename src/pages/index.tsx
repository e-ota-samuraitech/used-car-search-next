import Layout from '@/components/common/Layout';
import SearchBar from '@/components/results/SearchBar';
import SearchLogo from '@/components/common/SearchLogo';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Quick Links データ（SEO準拠のURL構造）
const QUICK_LINKS = [
  { label: 'トヨタ', href: '/cars/m-toyota/' },
  { label: 'ホンダ', href: '/cars/m-honda/' },
  { label: '日産', href: '/cars/m-nissan/' },
  { label: 'マツダ', href: '/cars/m-mazda/' },
  { label: 'スバル', href: '/cars/m-subaru/' },
];

// キャンペーンデータ（静的ダミー）
const CAMPAIGNS = [
  {
    id: '1',
    dealer: 'カーセンター東京',
    title: '新春セール開催中！',
    description: '全車両10万円値引き',
    endDate: '2025年1月31日まで',
  },
  {
    id: '2',
    dealer: 'マツダオート大阪',
    title: '決算セール実施中',
    description: 'SUV特別価格',
    endDate: '2025年3月31日まで',
  },
  {
    id: '3',
    dealer: 'トヨタ福岡中央',
    title: '春の大感謝祭',
    description: 'ミニバン限定キャンペーン',
    endDate: '2025年4月30日まで',
  },
];

export default function TopPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);
    const handleError = () => setIsNavigating(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router.events]);

  return (
    <Layout showFilters={false}>
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-12">
        <div className="w-full max-w-2xl">
          {/* Logo + Title */}
          <SearchLogo />

          {/* Search Box + Buttons */}
          <div className="mb-6 md:mb-8">
            <SearchBar variant="large" isNavigating={isNavigating} placeholder="車種、メーカー、地域で検索" />

            {/* 注目の車両ボタン */}
            <div className="flex justify-center mt-4">
              <Link
                href="/cars/"
                className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-50 text-xs md:text-sm text-gray-700 rounded hover:border hover:border-gray-300 hover:shadow-sm transition-all whitespace-nowrap"
              >
                注目の車両
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm text-gray-600 px-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:underline whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Campaign Section */}
      <section className="px-4 md:px-6 py-8 md:py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <h2 className="text-lg md:text-xl font-medium text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <span>🔥</span>
            今、何が起きているか
          </h2>

          {/* Campaign Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {CAMPAIGNS.map((campaign) => (
              <Link
                key={campaign.id}
                href="/campaigns"
                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 block"
              >
                {/* Image Placeholder */}
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">キャンペーン画像</span>
                </div>
                {/* Content */}
                <div className="p-4 md:p-5">
                  <div className="text-xs text-gray-500 mb-2">{campaign.dealer}</div>
                  <h3 className="font-medium text-gray-800 mb-2">{campaign.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                  <div className="text-xs text-red-600 font-medium">{campaign.endDate}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-6 md:mt-8">
            <Link
              href="/campaigns"
              className="inline-block px-6 py-3 bg-white border border-gray-300 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              すべてのキャンペーンを見る
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
