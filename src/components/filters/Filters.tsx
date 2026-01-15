import { useState, useEffect, ChangeEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { useGeoFilters } from '@/hooks/useGeoFilters';
import { buildFilterUrl, evaluateKeywordUpgrade } from '@/lib/seo';
import type { Filters as FiltersType } from '@/types';

interface FiltersProps {
  isModalMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const Filters = ({ isModalMode = false, isOpen = true, onClose }: FiltersProps) => {
  const { filters, query } = useApp();
  const { regionToPrefs, prefToCities, makers, regions } = useGeoFilters();

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
    const q = (query || '').trim();

    // 1) キーワードが昇格できない場合: /results に留めて q を保持し、フィルタはクエリで渡す
    if (q) {
      const upgrade = evaluateKeywordUpgrade(q);
      if (!upgrade.canUpgrade) {
        const params = new URLSearchParams();
        params.set('q', q);
        if (localFilters.maker) params.set('maker', localFilters.maker);
        if (localFilters.region) params.set('region', localFilters.region);
        if (localFilters.pref) params.set('pref', localFilters.pref);
        if (localFilters.city) params.set('city', localFilters.city);
        if (localFilters.minMan) params.set('minMan', localFilters.minMan);
        if (localFilters.maxMan) params.set('maxMan', localFilters.maxMan);
        if (localFilters.priceChangedOnly) params.set('priceChangedOnly', 'true');

        window.location.assign(`/results?${params.toString()}`);
        return;
      }

      // 2) 昇格できる場合: /cars/... に吸収して構造化URLへ（qは消える）
      const { url } = buildFilterUrl({
        maker: localFilters.maker,
        pref: localFilters.pref,
        city: localFilters.city,
        minMan: localFilters.minMan,
        maxMan: localFilters.maxMan,
        priceChangedOnly: localFilters.priceChangedOnly,
      });

      // 昇格パス（例: /cars/m-toyota/s-prius/）とフィルター構造をマージ
      // - maker昇格: maker は昇格を優先
      // - model昇格: maker+model を優先し、pref があれば pref-model へ
      const upgradePath = upgrade.upgradePath || '/cars/';
      const upgradedSegments = upgradePath.split('/').filter(Boolean).slice(1); // remove 'cars'

      const prefSlug = localFilters.pref ? url.split('/').filter(Boolean)[1] : null;

      // 既に buildFilterUrl で構造化できている場合はそれをベースにする（pref/city/maker）
      const basePathname = url.split('?')[0];
      const baseSegments = basePathname.split('/').filter(Boolean).slice(1);

      // upgrade が model の場合
      if (upgrade.matchType === 'model') {
        const mSeg = upgradedSegments.find(s => s.startsWith('m-'));
        const sSeg = upgradedSegments.find(s => s.startsWith('s-'));

        if (baseSegments.length > 0 && baseSegments[0].startsWith('p-') && mSeg && sSeg) {
          window.location.assign(`/cars/${baseSegments[0]}/${mSeg}/${sSeg}/`);
          return;
        }

        window.location.assign(upgradePath);
        return;
      }

      // maker/feature/pref/city の場合は、原則 base の構造化URLへ（makerは昇格済みなのでbaseがmakerなら整合）
      if (url !== '/cars/') {
        window.location.assign(url);
        return;
      }

      window.location.assign(upgradePath);
      return;
    }

    // キーワードなし: 従来どおり構造化URLへ
    const { url } = buildFilterUrl({
      maker: localFilters.maker,
      pref: localFilters.pref,
      city: localFilters.city,
      minMan: localFilters.minMan,
      maxMan: localFilters.maxMan,
      priceChangedOnly: localFilters.priceChangedOnly,
    });

    window.location.assign(url);
  };

  const handleReset = () => {
    // リセット → /cars/ に遷移（MPA）
    window.location.assign('/cars/');
  };

  const prefsForRegion = localFilters.region ? regionToPrefs[localFilters.region] || [] : [];
  const citiesForPref = localFilters.pref ? prefToCities[localFilters.pref] || [] : [];

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
