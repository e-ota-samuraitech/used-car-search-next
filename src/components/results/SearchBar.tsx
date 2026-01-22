import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';
import { buildSearchUrl, normalizeQueryValue } from '@/lib/seo';
import { carsKeyFromCarsPath, clearFreewordContext, setFreewordContext } from '@/lib/freewordSession';
import Spinner from '@/components/common/Spinner';

interface SearchBarProps {
  onSearch?: () => void;
  variant?: 'large' | 'compact';
  isNavigating?: boolean;
  placeholder?: string;
}

// SVG Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ClearIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SearchBar = ({ onSearch, variant = 'large', isNavigating = false, placeholder }: SearchBarProps) => {
  const { query, setQuery, filters } = useApp();
  const router = useRouter();
  const urlQ = normalizeQueryValue(router.query.q).trim();
  const [localQuery, setLocalQuery] = useState(urlQ || query);
  const didInit = useRef(false);

  // 初回のみ同期（毎回urlQで上書きしない）
  useEffect(() => {
    if (!router.isReady) return;
    if (didInit.current) return;
    didInit.current = true;

    const initial = urlQ || query;
    setLocalQuery(initial);
    if (urlQ && urlQ !== query) {
      setQuery(urlQ);
    }
  }, [router.isReady, urlQ, query, setQuery]);

  // routeChangeComplete で URL と同期（ブラウザバック対応）
  useEffect(() => {
    const handleComplete = (url: string) => {
      try {
        const params = new URL(url, window.location.origin).searchParams;
        const q = params.get('q') || '';
        setLocalQuery(q);
      } catch {
        // URL parse error - ignore
      }
    };
    router.events.on('routeChangeComplete', handleComplete);
    return () => {
      router.events.off('routeChangeComplete', handleComplete);
    };
  }, [router.events]);

  const handleSearch = async () => {
    if (isNavigating) return; // 二重送信ガード

    const trimmed = localQuery.trim();
    setQuery(trimmed);

    if (!trimmed) {
      clearFreewordContext();
    }

    // 遷移先の決定は1箇所に集約（specに完全一致のみ /cars、それ以外は /results に全条件保持）
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
      if (onSearch) onSearch();
      return;
    }

    clearFreewordContext();

    // /results 上で同じ q をもう一度検索したい場合（URLが変わらない）
    if (router.pathname === '/results') {
      const currentQ = normalizeQueryValue(router.query.q).trim();
      if (trimmed === currentQ && router.asPath === next.url) {
        // Same URL: force SSR refresh via router.replace
        await router.replace(next.url);
        if (onSearch) onSearch();
        return;
      }
    }

    await router.push(next.url);
    if (onSearch) onSearch();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  const handleClear = () => {
    setLocalQuery('');
  };

  // Variant-based styles
  const isLarge = variant === 'large';
  const containerPadding = isLarge ? 'px-4 md:px-6 py-3 md:py-4' : 'px-3 md:px-4 py-2 md:py-2.5';
  const iconSize = isLarge ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 md:w-5 md:h-5';
  const inputTextSize = isLarge ? 'text-sm md:text-base' : 'text-xs md:text-sm';
  const containerShadow = isLarge ? 'hover:shadow-lg' : 'hover:shadow-md';
  const buttonPadding = isLarge ? 'px-6 md:px-8 py-2.5 md:py-3' : 'px-4 md:px-6 py-2 md:py-2.5';
  const buttonTextSize = isLarge ? 'text-sm md:text-base' : 'text-xs md:text-sm';

  return (
    <form onSubmit={handleSubmit} className={`flex ${isLarge ? 'flex-col sm:flex-row' : 'flex-row'} gap-3 ${isLarge ? 'items-center justify-center' : 'items-center'}`}>
      {/* Search Input Container */}
      <div className={`relative flex items-center w-full ${isLarge ? 'max-w-2xl' : ''} border border-gray-300 rounded-full ${containerPadding} ${containerShadow} transition-shadow bg-white group`}>
        {/* Search Icon */}
        <SearchIcon className={`${iconSize} text-gray-400 mr-2 md:mr-3 flex-shrink-0`} />

        {/* Input */}
        <input
          type="text"
          placeholder={placeholder ?? '車種、メーカー、地域で検索'}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className={`flex-1 outline-none ${inputTextSize} text-gray-700 bg-transparent min-w-0`}
        />

        {/* Clear Button */}
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="クリア"
          >
            <ClearIcon className={iconSize} />
          </button>
        )}
      </div>

      {/* Search Button */}
      <button
        type="submit"
        disabled={isNavigating}
        className={`${buttonPadding} bg-accent text-white ${buttonTextSize} font-medium rounded-full hover:bg-accent/90 transition-all shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 flex-shrink-0`}
      >
        {isNavigating ? (
          <>
            <Spinner size="sm" />
            <span>検索中…</span>
          </>
        ) : (
          '検索'
        )}
      </button>
    </form>
  );
};

export default SearchBar;
