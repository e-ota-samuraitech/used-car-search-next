import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';
import { useGeoFilters } from '@/hooks/useGeoFilters';
import type { Filters as FiltersType } from '@/types';

const Filters = () => {
  const { filters, setFilters, resetFilters, runSearch } = useApp();
  const { regionToPrefs, prefToCities, makers, regions } = useGeoFilters();
  const router = useRouter();

  const [localFilters, setLocalFilters] = useState<FiltersType>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleRegionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    setLocalFilters({
      ...localFilters,
      region,
      pref: '',
      city: '',
    });
  };

  const handlePrefChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const pref = e.target.value;
    setLocalFilters({
      ...localFilters,
      pref,
      city: '',
    });
  };

  const handleApply = () => {
    setFilters(localFilters);
    
    // 検索結果ページでない場合は遷移
    if (router.pathname !== '/results') {
      router.push('/results');
    } else {
      runSearch();
    }
  };

  const handleReset = () => {
    const emptyFilters: FiltersType = {
      maker: '',
      region: '',
      pref: '',
      city: '',
      minMan: '',
      maxMan: '',
      priceChangedOnly: false,
    };
    setLocalFilters(emptyFilters);
    resetFilters();
    
    if (router.pathname === '/results') {
      runSearch();
    }
  };

  const prefsForRegion = localFilters.region ? regionToPrefs[localFilters.region] || [] : [];
  const citiesForPref = localFilters.pref ? prefToCities[localFilters.pref] || [] : [];

  return (
    <aside className="w-full lg:w-[320px]">
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden h-fit">
        <h3 className="m-0 px-3 py-2.5 text-[13px] text-muted bg-gray-50 border-b border-gray-200">
          絞り込み
        </h3>
        <div className="p-3">
          <div className="mb-2.5">
            <label className="block text-xs text-muted mb-1.5">メーカー</label>
            <select
              value={localFilters.maker}
              onChange={(e) => setLocalFilters({ ...localFilters, maker: e.target.value })}
              className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
            >
              <option value="">すべて</option>
              {makers.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="mb-2.5">
            <label className="block text-xs text-muted mb-1.5">地域</label>
            <select 
              value={localFilters.region} 
              onChange={handleRegionChange}
              className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white"
            >
              <option value="">すべて</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="mb-2.5">
            <label className="block text-xs text-muted mb-1.5">都道府県</label>
            <select
              value={localFilters.pref}
              onChange={handlePrefChange}
              disabled={!localFilters.region}
              className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white disabled:opacity-50"
            >
              <option value="">
                {localFilters.region ? 'すべて' : 'まず地域を選択'}
              </option>
              {prefsForRegion.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="mb-2.5">
            <label className="block text-xs text-muted mb-1.5">市区町村</label>
            <select
              value={localFilters.city}
              onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value })}
              disabled={!localFilters.pref}
              className="w-full h-[38px] rounded-[10px] border border-gray-200 px-2.5 outline-none bg-white disabled:opacity-50"
            >
              <option value="">
                {localFilters.pref ? 'すべて' : 'まず都道府県を選択'}
              </option>
              {citiesForPref.map(c => (
                <option key={c} value={c}>{c}</option>
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
        </div>
      </div>
    </aside>
  );
};

export default Filters;
