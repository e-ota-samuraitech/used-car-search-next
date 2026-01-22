import { useState, useEffect, ChangeEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { useGeoFilters } from '@/hooks/useGeoFilters';
import { buildSearchUrl } from '@/lib/seo';
import { carsKeyFromCarsPath, getFreewordContext } from '@/lib/freewordSession';
import type { Filters as FiltersType } from '@/types';

interface FiltersProps {
  isModalMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const Filters = ({ isModalMode = false, isOpen = true, onClose }: FiltersProps) => {
  const { filters, query, resetFilters } = useApp();
  const { prefToCities, makers, prefs } = useGeoFilters();

  const [localFilters, setLocalFilters] = useState<FiltersType>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handlePrefChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const prefSlug = e.target.value;
    setLocalFilters({
      ...localFilters,
      prefSlug,
      citySlug: '',
    });
  };

  const handleApply = () => {
    const currentHref = typeof window !== 'undefined' ? window.location.href : '';
    const currentUrl = currentHref ? new URL(currentHref) : null;
    const pathname = currentUrl?.pathname || '';
    const isResultsPage = pathname.startsWith('/results');
    const isCarsPage = pathname.startsWith('/cars');

    const qFromContext = (query || '').trim();
    const qFromUrl = isResultsPage ? (currentUrl?.searchParams.get('q') || '').trim() : '';
    let qFromSession = '';
    if (!isResultsPage && isCarsPage) {
      const ctx = getFreewordContext();
      if (ctx) {
        const currentCarsKey = carsKeyFromCarsPath(pathname);
        if (currentCarsKey && currentCarsKey === ctx.sourceCarsKey) {
          qFromSession = (ctx.lastFreewordQuery || '').trim();
        }
      }
    }

    const effectiveQ = qFromContext || qFromUrl || qFromSession;

    // 遷移先の決定は1箇所に集約（specに完全一致のみ /cars、それ以外は /results に全条件保持）
    const { url } = buildSearchUrl({
      q: effectiveQ,
      makerSlug: localFilters.makerSlug,
      prefSlug: localFilters.prefSlug,
      citySlug: localFilters.citySlug,
      featureSlug: localFilters.featureSlug,
      minMan: localFilters.minMan,
      maxMan: localFilters.maxMan,
      priceChangedOnly: localFilters.priceChangedOnly,
    });

    window.location.assign(url);
  };

  const handleReset = () => {
    const currentHref = typeof window !== 'undefined' ? window.location.href : '';
    const currentUrl = currentHref ? new URL(currentHref) : null;
    const pathname = currentUrl?.pathname || '';
    const isResultsPage = pathname.startsWith('/results');
    const isCarsPage = pathname.startsWith('/cars');

    const qFromContext = (query || '').trim();
    const qFromUrl = isResultsPage ? (currentUrl?.searchParams.get('q') || '').trim() : '';
    let qFromSession = '';
    if (!isResultsPage && isCarsPage) {
      const ctx = getFreewordContext();
      if (ctx) {
        const currentCarsKey = carsKeyFromCarsPath(pathname);
        if (currentCarsKey && currentCarsKey === ctx.sourceCarsKey) {
          qFromSession = (ctx.lastFreewordQuery || '').trim();
        }
      }
    }

    const effectiveQ = qFromContext || qFromUrl || qFromSession;
    const sort = (currentUrl?.searchParams.get('sort') || '').trim();

    // UI/Context を初期化（/results 遷移後も AppProvider が保持されるため）
    resetFilters();
    setLocalFilters({
      makerSlug: '',
      prefSlug: '',
      citySlug: '',
      featureSlug: '',
      minMan: '',
      maxMan: '',
      priceChangedOnly: false,
    });

    // /cars には行かない。q を維持し、filter系/page は落とす。sort は維持。
    const params = new URLSearchParams();
    if (effectiveQ) params.set('q', effectiveQ);
    if (sort) params.set('sort', sort);
    const qs = params.toString();
    const url = qs ? `/results/?${qs}` : '/results/';
    window.location.assign(url);
  };

  const citiesForPref = localFilters.prefSlug ? prefToCities[localFilters.prefSlug] || [] : [];

  const FEATURE_OPTIONS: Array<{ slug: string; label: string }> = [
    { slug: '4wd', label: '4WD' },
    { slug: 'hybrid', label: 'ハイブリッド' },
    { slug: 'mt', label: 'MT' },
    { slug: 'diesel', label: 'ディーゼル' },
    { slug: 'suv', label: 'SUV' },
    { slug: 'minivan', label: 'ミニバン' },
    { slug: 'kei', label: '軽自動車' },
    { slug: 'wagon', label: 'ワゴン' },
    { slug: 'sedan', label: 'セダン' },
    { slug: 'hatchback', label: 'ハッチバック' },
  ];

  // PC版で閉じている場合は表示しない
  if (!isModalMode && !isOpen) {
    return null;
  }

  // モーダルモード時のコンテンツ
  const filtersContent = (
    <>
      <div className="mb-2.5">
        <label className="block text-xs text-muted mb-1.5">メーカー</label>
        <select
          value={localFilters.makerSlug}
          onChange={(e) => setLocalFilters({ ...localFilters, makerSlug: e.target.value })}
          className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
        >
          <option value="">すべて</option>
          {makers.map(m => (
            <option key={m.slug} value={m.slug}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-2.5">
        <label className="block text-xs text-muted mb-1.5">特徴</label>
        <select
          value={localFilters.featureSlug}
          onChange={(e) => setLocalFilters({ ...localFilters, featureSlug: e.target.value })}
          className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
        >
          <option value="">すべて</option>
          {FEATURE_OPTIONS.map(f => (
            <option key={f.slug} value={f.slug}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-2.5">
        <label className="block text-xs text-muted mb-1.5">都道府県</label>
        <select
          value={localFilters.prefSlug}
          onChange={handlePrefChange}
          className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
        >
          <option value="">
            すべて
          </option>
          {prefs.map(p => (
            <option key={p.slug} value={p.slug}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-2.5">
        <label className="block text-xs text-muted mb-1.5">市区町村</label>
        <select
          value={localFilters.citySlug}
          onChange={(e) => setLocalFilters({ ...localFilters, citySlug: e.target.value })}
          disabled={!localFilters.prefSlug}
          className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white disabled:opacity-50"
        >
          <option value="">
            {localFilters.prefSlug ? 'すべて' : 'まず都道府県を選択'}
          </option>
          {citiesForPref.map(c => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-2.5">
        <label className="block text-xs text-muted mb-1.5">価格帯（万円）</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="下限"
            value={localFilters.minMan}
            onChange={(e) => setLocalFilters({ ...localFilters, minMan: e.target.value })}
            className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
          />
          <input
            type="number"
            min="0"
            placeholder="上限"
            value={localFilters.maxMan}
            onChange={(e) => setLocalFilters({ ...localFilters, maxMan: e.target.value })}
            className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
          />
        </div>
      </div>

      <label className="flex gap-2 items-center text-[13px] my-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={localFilters.priceChangedOnly}
          onChange={(e) => setLocalFilters({ ...localFilters, priceChangedOnly: e.target.checked })}
        />
        価格変動ありのみ
      </label>

      <div className="flex justify-between mt-3 gap-2">
        <button
          className="h-10 px-3.5 border border-gray-200 rounded-full bg-white cursor-pointer whitespace-nowrap"
          onClick={handleReset}
          type="button"
        >
          リセット
        </button>
        <button
          className="h-10 px-3.5 border-0 rounded-full bg-accent text-white font-extrabold cursor-pointer whitespace-nowrap"
          onClick={handleApply}
          type="button"
        >
          適用
        </button>
      </div>
    </>
  );

  // モーダルモード時
  if (isModalMode) {
    return (
      <>
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        {/* モーダルコンテンツ */}
        <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-[500px] md:max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-bold">絞り込み検索</h3>
              <button
                onClick={onClose}
                className="text-2xl text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh] md:max-h-[calc(90vh-60px)]">
              {filtersContent}
            </div>
          </div>
        </div>
      </>
    );
  }

  // 通常モード（PC版サイドバー）
  return (
    <aside className="w-full lg:w-[320px]">
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden h-fit">
        <h3 className="m-0 px-3 py-2.5 text-[13px] text-muted bg-gray-50 border-b border-gray-200">
          絞り込み
        </h3>
        <div className="p-3">
          {filtersContent}
        </div>
      </div>
    </aside>
  );
};

export default Filters;
