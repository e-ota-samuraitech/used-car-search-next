import { useEffect, useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';
import { buildSearchUrl, normalizeQueryValue } from '@/lib/seo';
import { carsKeyFromCarsPath, clearFreewordContext, setFreewordContext } from '@/lib/freewordSession';

interface SearchBarProps {
  onSearch?: () => void;
  variant?: 'large' | 'compact';
}

const SearchBar = ({ onSearch, variant = 'large' }: SearchBarProps) => {
  const { query, setQuery, filters } = useApp();
  const router = useRouter();
  const urlQ = normalizeQueryValue(router.query.q).trim();
  const [localQuery, setLocalQuery] = useState(urlQ || query);

  useEffect(() => {
    // Prefer URL q (direct access /results?q=...) to avoid empty input.
    // Fallback to context query for pages without ?q.
    if (!router.isReady) return;

    const next = urlQ || query;
    setLocalQuery(next);
    if (urlQ && urlQ !== query) {
      setQuery(urlQ);
    }
  }, [router.isReady, urlQ, query, setQuery]);

  const handleSearch = async () => {
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
        // Same URL: avoid /api/search (can be blocked by IAP) and force SSR refresh.
        // router.push/replace may not re-run SSR on identical URL, so do a full reload.
        window.location.assign(next.url);
        return;
      }
    }

    await router.push(next.url);
    if (onSearch) onSearch();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const inputHeight = variant === 'large' ? 'h-[48px]' : 'h-[40px]';
  const buttonHeight = variant === 'large' ? 'h-[48px]' : 'h-[40px]';
  const inputMaxWidth = variant === 'large' ? 'max-w-[600px]' : 'max-w-full';
  const inputTextSize = variant === 'large' ? 'text-base' : 'text-sm';
  const inputShadow = variant === 'large' ? 'shadow-md hover:shadow-lg' : 'shadow-sm';
  const containerJustify = variant === 'large' ? 'justify-center' : 'justify-start';

  return (
    <div className={`flex gap-2.5 items-center ${containerJustify} flex-nowrap`}>
      <input
        type="text"
        placeholder="例：プリウス 2020 東京"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`w-full ${inputMaxWidth} ${inputHeight} px-4 rounded-full border border-gray-200 outline-none focus:border-accent ${inputShadow} ${inputTextSize} min-w-0 transition-all`}
      />
      <button
        type="button"
        onClick={handleSearch}
        className={`${buttonHeight} px-[18px] rounded-full border-0 bg-accent text-white cursor-pointer font-extrabold whitespace-nowrap flex-shrink-0 hover:bg-accent/90 transition-colors`}
      >
        検索
      </button>
    </div>
  );
};

export default SearchBar;
