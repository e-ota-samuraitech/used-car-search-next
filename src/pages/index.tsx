import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef, FormEvent } from 'react';
import Footer from '@/components/common/Footer';
import { useApp } from '@/context/AppContext';
import { buildSearchUrl } from '@/lib/seo';
import { carsKeyFromCarsPath, clearFreewordContext, setFreewordContext } from '@/lib/freewordSession';

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
  const { setQuery, filters } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 検索開始は submit 時のみ（ログイン遷移等で検索中にならないように）
  useEffect(() => {
    const handleDone = () => {
      setIsSearching(false);
    };
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);
    return () => {
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
    };
  }, [router.events]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (isSearching) return;

    const trimmed = searchQuery.trim();
    // 空の場合は入力欄にフォーカス
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    setIsSearching(true);
    setQuery(trimmed);

    if (!trimmed) {
      clearFreewordContext();
    }

    const next = buildSearchUrl({
      q: trimmed,
      makerSlug: filters.makerSlug,
      prefSlug: filters.prefSlug,
      citySlug: filters.citySlug,
      featureSlug: filters.featureSlug,
      minMan: filters.minMan,
      maxMan: filters.maxMan,
    });

    if (next.destination === 'cars') {
      const sourceCarsKey = carsKeyFromCarsPath(next.url);
      if (sourceCarsKey && trimmed) {
        setFreewordContext({ lastFreewordQuery: trimmed, sourceCarsKey });
      } else {
        clearFreewordContext();
      }
      try {
        await router.push(next.url);
      } catch {
        setIsSearching(false);
      }
      return;
    }

    clearFreewordContext();
    try {
      await router.push(next.url);
    } catch {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header (readdy準拠) */}
      <header className="relative z-50 px-4 md:px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <Image
            src="/readdy-logo.png"
            alt="中古車速報"
            width={40}
            height={40}
            className="h-8 md:h-10 w-auto"
          />
        </div>
        <Link
          href="/login/"
          className="px-4 md:px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 rounded-full transition-colors whitespace-nowrap cursor-pointer"
        >
          ログイン
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-0 flex-1 flex flex-col items-center justify-center px-4 md:px-6">
        <div className="w-full max-w-2xl">
          {/* Logo + Title */}
          <div className="text-center mb-6 md:mb-8">
            <Image
              src="/readdy-logo.png"
              alt="中古車速報"
              width={96}
              height={96}
              className="h-16 md:h-24 w-auto mx-auto mb-3 md:mb-4"
            />
            <h1 className="text-xl md:text-2xl font-normal text-gray-700">中古車速報</h1>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative group flex-1 min-w-0">
                <div className="flex items-center border border-gray-300 rounded-full px-4 md:px-6 py-3 md:py-4 hover:shadow-lg transition-shadow bg-white">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mr-3 md:mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="車種、メーカー、地域で検索"
                    disabled={isSearching}
                    className="flex-1 min-w-0 outline-none text-sm md:text-base text-gray-700 bg-transparent disabled:opacity-70"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      disabled={isSearching}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="クリア"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-6 md:px-8 py-2.5 md:py-3 bg-teal-600 text-white text-sm md:text-base font-medium rounded-full hover:bg-teal-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-600"
              >
                {isSearching ? '検索中…' : '検索'}
              </button>
            </div>

            <div className="flex justify-center mt-3 md:mt-4">
              <Link
                href="/cars/"
                className="text-sm font-medium text-teal-700 hover:text-teal-800 hover:underline underline-offset-2"
              >
                注目の車両
              </Link>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm text-gray-600 px-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:underline cursor-pointer whitespace-nowrap"
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
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 23c-1.1 0-1.99-.89-1.99-1.99h3.98c0 1.1-.89 1.99-1.99 1.99zm7-2.01H5v-2l1-1v-5.8c0-3.25 1.82-5.95 5-6.67V4c0-.83.67-1.5 1.5-1.5S14 3.17 14 4v.52c3.18.72 5 3.42 5 6.68v5.8l1 1v2z" />
            </svg>
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
              className="inline-block px-6 py-3 bg-white border border-gray-300 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              すべてのキャンペーンを見る
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
