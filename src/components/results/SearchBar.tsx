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

  const inputHeight = variant === 'large' ? 'h-[48px]' : 'h-[40px]';
  const buttonHeight = variant === 'large' ? 'h-[48px]' : 'h-[40px]';
  const inputMaxWidth = variant === 'large' ? 'max-w-[600px]' : 'max-w-full';
  const inputTextSize = variant === 'large' ? 'text-base' : 'text-sm';
  const inputShadow = variant === 'large' ? 'shadow-md hover:shadow-lg' : 'shadow-sm';
  const containerJustify = variant === 'large' ? 'justify-center' : 'justify-start';

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2.5 items-center ${containerJustify} flex-nowrap`}>
      <input
        type="text"
        placeholder={placeholder ?? '例：プリウス 2020 東京'}
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        className={`w-full ${inputMaxWidth} ${inputHeight} px-4 rounded-full border border-gray-200 outline-none focus:border-accent ${inputShadow} ${inputTextSize} min-w-0 transition-all`}
      />
      <button
        type="submit"
        disabled={isNavigating}
        className={`${buttonHeight} px-[18px] rounded-full border-0 bg-accent text-white cursor-pointer font-extrabold whitespace-nowrap flex-shrink-0 hover:bg-accent/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5`}
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
