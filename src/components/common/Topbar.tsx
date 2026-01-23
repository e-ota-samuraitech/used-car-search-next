import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, FormEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { buildSearchUrl, normalizeQueryValue } from '@/lib/seo';
import { carsKeyFromCarsPath, clearFreewordContext, setFreewordContext } from '@/lib/freewordSession';

interface TopbarProps {
  variant?: 'home' | 'search';
}

const Topbar = ({ variant = 'home' }: TopbarProps) => {
  const router = useRouter();
  const { query, setQuery, filters } = useApp();
  const urlQ = normalizeQueryValue(router.query.q).trim();
  const [localQuery, setLocalQuery] = useState(urlQ || query);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = localQuery.trim();
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
      priceChangedOnly: filters.priceChangedOnly,
    });

    if (next.destination === 'cars') {
      const sourceCarsKey = carsKeyFromCarsPath(next.url);
      if (sourceCarsKey && trimmed) {
        setFreewordContext({ lastFreewordQuery: trimmed, sourceCarsKey });
      } else {
        clearFreewordContext();
      }
      await router.push(next.url);
      return;
    }

    clearFreewordContext();
    await router.push(next.url);
  };

  // トップページ用: readdy風シンプルヘッダー（ロゴ左 + ログイン右）
  if (variant === 'home') {
    return (
      <header className="px-4 md:px-6 py-4 flex items-center justify-between bg-white">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/readdy-logo.png"
            alt="中古車速報"
            width={40}
            height={40}
            className="h-8 md:h-10 w-auto"
          />
        </Link>
        <Link
          href="/login"
          className="px-4 md:px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors whitespace-nowrap"
        >
          ログイン
        </Link>
      </header>
    );
  }

  // 検索結果ページ用: readdy /search 相当（ロゴ + 検索バー + ログイン）
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
      <div className="px-4 md:px-6 py-3 flex items-center gap-3 md:gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <Image
            src="/readdy-logo.png"
            alt="中古車速報"
            width={40}
            height={40}
            className="h-7 md:h-8 w-auto"
          />
        </Link>

        {/* Search Bar (center) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex items-center border border-gray-300 rounded-full px-3 md:px-4 py-1.5 md:py-2 hover:shadow-md transition-shadow bg-white">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 mr-2 md:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="車種、メーカー、地域で検索"
              className="flex-1 outline-none text-xs md:text-sm text-gray-700 bg-transparent"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => setLocalQuery('')}
                className="ml-2 cursor-pointer"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Login Button */}
        <Link
          href="/login"
          className="hidden md:block px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors whitespace-nowrap cursor-pointer"
        >
          ログイン
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
