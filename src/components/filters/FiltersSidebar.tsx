/**
 * 価格.com風 絞り込みサイドバー
 *
 * - クリック即時反映（適用ボタンなし）
 * - 選択済み条件をチップ表示
 * - もっと見る/折りたたみ
 */

import { useState, useCallback, useMemo, KeyboardEvent, FocusEvent } from 'react';
import { useRouter } from 'next/router';
import type { Facet } from '@/server/search/searchClient';
import {
  parseFilterQuery,
  parseQueryQ,
  pushFilterUpdate,
  pushFilterReset,
  isFilterEmpty,
  normalizePrice,
  type FilterState,
  EMPTY_FILTER_STATE,
} from '@/lib/filterQuery';
import { getFeatureLabel, FEATURE_LABELS } from '@/lib/featureMaster';
import { useGeoFilters } from '@/hooks/useGeoFilters';

// ============================================
// Props
// ============================================

interface FiltersSidebarProps {
  facets: Facet[];
  isModalMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

// ============================================
// ラベル取得ヘルパー
// ============================================

function getMakerLabel(slug: string, makers: Array<{ slug: string; name: string }>): string {
  const found = makers.find((m) => m.slug === slug);
  return found?.name ?? slug;
}

function getPrefLabel(slug: string, prefs: Array<{ slug: string; name: string }>): string {
  const found = prefs.find((p) => p.slug === slug);
  return found?.name ?? slug;
}

function getCityLabel(
  slug: string,
  prefSlug: string,
  prefToCities: Record<string, Array<{ slug: string; name: string }>>
): string {
  const cities = prefToCities[prefSlug] ?? [];
  const found = cities.find((c) => c.slug === slug);
  return found?.name ?? slug;
}

// ============================================
// FacetSection コンポーネント
// ============================================

interface FacetSectionProps {
  title: string;
  items: Array<{ slug: string; label: string }>;
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
  multiSelect?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

function FacetSection({
  title,
  items,
  selectedSlugs,
  onToggle,
  multiSelect = true,
  disabled = false,
  disabledMessage,
}: FacetSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_SHOW = 10;

  // ラベル昇順でソート
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  }, [items]);

  const displayItems = expanded ? sortedItems : sortedItems.slice(0, INITIAL_SHOW);
  const hasMore = sortedItems.length > INITIAL_SHOW;

  if (disabled) {
    return (
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-700 mb-2">{title}</div>
        <div className="text-xs text-gray-400 italic">{disabledMessage ?? '選択できません'}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="text-xs font-medium text-gray-700 mb-2">{title}</div>
      <div className="space-y-1">
        {displayItems.map((item) => {
          const isSelected = selectedSlugs.includes(item.slug);
          return (
            <label
              key={item.slug}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded text-sm"
            >
              <input
                type={multiSelect ? 'checkbox' : 'radio'}
                checked={isSelected}
                onChange={() => onToggle(item.slug)}
                className="accent-blue-600"
              />
              <span className={isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'}>
                {item.label}
              </span>
            </label>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          {expanded ? '折りたたむ' : `もっと見る（残り${sortedItems.length - INITIAL_SHOW}件）`}
        </button>
      )}
    </div>
  );
}

// ============================================
// SelectedFiltersChips コンポーネント
// ============================================

interface SelectedFiltersChipsProps {
  filter: FilterState;
  makers: Array<{ slug: string; name: string }>;
  prefs: Array<{ slug: string; name: string }>;
  prefToCities: Record<string, Array<{ slug: string; name: string }>>;
  onRemoveMaker: (slug: string) => void;
  onRemoveFeature: (slug: string) => void;
  onRemovePref: () => void;
  onRemoveCity: () => void;
  onRemovePrice: () => void;
  onRemovePriceChanged: () => void;
  onClearAll: () => void;
}

function SelectedFiltersChips({
  filter,
  makers,
  prefs,
  prefToCities,
  onRemoveMaker,
  onRemoveFeature,
  onRemovePref,
  onRemoveCity,
  onRemovePrice,
  onRemovePriceChanged,
  onClearAll,
}: SelectedFiltersChipsProps) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  // メーカー
  for (const slug of filter.makers) {
    chips.push({
      key: `maker-${slug}`,
      label: getMakerLabel(slug, makers),
      onRemove: () => onRemoveMaker(slug),
    });
  }

  // 特徴
  for (const slug of filter.features) {
    chips.push({
      key: `feat-${slug}`,
      label: getFeatureLabel(slug),
      onRemove: () => onRemoveFeature(slug),
    });
  }

  // 都道府県
  if (filter.pref) {
    chips.push({
      key: 'pref',
      label: getPrefLabel(filter.pref, prefs),
      onRemove: onRemovePref,
    });
  }

  // 市区町村
  if (filter.city) {
    chips.push({
      key: 'city',
      label: getCityLabel(filter.city, filter.pref, prefToCities),
      onRemove: onRemoveCity,
    });
  }

  // 価格
  if (filter.min || filter.max) {
    const minLabel = filter.min ? `${filter.min}万円` : '';
    const maxLabel = filter.max ? `${filter.max}万円` : '';
    const priceLabel = filter.min && filter.max
      ? `${minLabel}〜${maxLabel}`
      : filter.min
        ? `${minLabel}以上`
        : `${maxLabel}以下`;
    chips.push({
      key: 'price',
      label: priceLabel,
      onRemove: onRemovePrice,
    });
  }

  // 価格変動
  if (filter.priceChanged) {
    chips.push({
      key: 'priceChanged',
      label: '価格変動あり',
      onRemove: onRemovePriceChanged,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 pb-4 border-b border-gray-200">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
          >
            {chip.label}
            <button
              type="button"
              onClick={chip.onRemove}
              className="hover:text-blue-900 font-bold"
              aria-label={`${chip.label}を削除`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onClearAll}
        className="mt-2 text-xs text-gray-500 hover:text-gray-700 hover:underline"
      >
        すべての条件を解除
      </button>
    </div>
  );
}

// ============================================
// PriceRangeInput コンポーネント
// ============================================

interface PriceRangeInputProps {
  min: string;
  max: string;
  onApply: (min: string, max: string) => void;
}

function PriceRangeInput({ min: initialMin, max: initialMax, onApply }: PriceRangeInputProps) {
  const [localMin, setLocalMin] = useState(initialMin);
  const [localMax, setLocalMax] = useState(initialMax);

  // props が変わったら同期
  useMemo(() => {
    setLocalMin(initialMin);
    setLocalMax(initialMax);
  }, [initialMin, initialMax]);

  const handleApply = useCallback(() => {
    const normalized = normalizePrice(localMin, localMax);
    if (normalized.min !== initialMin || normalized.max !== initialMax) {
      onApply(normalized.min, normalized.max);
    }
  }, [localMin, localMax, initialMin, initialMax, onApply]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  const handleBlur = () => {
    handleApply();
  };

  return (
    <div className="mb-4">
      <div className="text-xs font-medium text-gray-700 mb-2">価格（万円）</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          placeholder="下限"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-20 h-8 text-sm border border-gray-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-gray-400">〜</span>
        <input
          type="number"
          min="0"
          placeholder="上限"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-20 h-8 text-sm border border-gray-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">Enterまたはフォーカスを外すと適用</p>
    </div>
  );
}

// ============================================
// メインコンポーネント
// ============================================

export default function FiltersSidebar({
  facets,
  isModalMode = false,
  isOpen = true,
  onClose,
}: FiltersSidebarProps) {
  const router = useRouter();

  // URL から現在のフィルタ状態を取得
  const currentFilter = useMemo(
    () => parseFilterQuery(router.query as Record<string, string | string[] | undefined>),
    [router.query]
  );
  const currentQ = useMemo(
    () => parseQueryQ(router.query as Record<string, string | string[] | undefined>),
    [router.query]
  );
  const currentSort = useMemo(() => {
    const s = router.query.sort;
    return typeof s === 'string' ? s : undefined;
  }, [router.query.sort]);

  // useGeoFilters からマスターデータを取得（facets のフォールバック用）
  const { makers: masterMakers, prefs: masterPrefs, prefToCities: masterPrefToCities } = useGeoFilters();

  // facets から候補を構築（なければマスターからフォールバック）
  const makerItems = useMemo(() => {
    const facet = facets.find((f) => f.key === 'makerSlug');
    if (facet && facet.values.length > 0) {
      return facet.values.map((v) => ({
        slug: v.value,
        label: getMakerLabel(v.value, masterMakers),
      }));
    }
    // fallback: masterMakers
    return masterMakers.map((m) => ({ slug: m.slug, label: m.name }));
  }, [facets, masterMakers]);

  const prefItems = useMemo(() => {
    const facet = facets.find((f) => f.key === 'prefSlug');
    if (facet && facet.values.length > 0) {
      return facet.values.map((v) => ({
        slug: v.value,
        label: getPrefLabel(v.value, masterPrefs),
      }));
    }
    return masterPrefs.map((p) => ({ slug: p.slug, label: p.name }));
  }, [facets, masterPrefs]);

  const cityItems = useMemo(() => {
    const facet = facets.find((f) => f.key === 'citySlug');
    if (facet && facet.values.length > 0) {
      return facet.values.map((v) => ({
        slug: v.value,
        label: getCityLabel(v.value, currentFilter.pref, masterPrefToCities),
      }));
    }
    // fallback: masterPrefToCities[currentPref]
    if (currentFilter.pref && masterPrefToCities[currentFilter.pref]) {
      return masterPrefToCities[currentFilter.pref].map((c) => ({ slug: c.slug, label: c.name }));
    }
    return [];
  }, [facets, currentFilter.pref, masterPrefToCities]);

  const featureItems = useMemo(() => {
    const facet = facets.find((f) => f.key === 'featureSlugs');
    if (facet && facet.values.length > 0) {
      return facet.values.map((v) => ({
        slug: v.value,
        label: getFeatureLabel(v.value),
      }));
    }
    // fallback: FEATURE_LABELS のキー
    return Object.entries(FEATURE_LABELS).map(([slug, label]) => ({ slug, label }));
  }, [facets]);

  // ============================================
  // イベントハンドラ
  // ============================================

  const updateFilter = useCallback(
    (newFilter: FilterState) => {
      pushFilterUpdate(router, newFilter, { q: currentQ, sort: currentSort });
    },
    [router, currentQ, currentSort]
  );

  // メーカー toggle
  const handleMakerToggle = useCallback(
    (slug: string) => {
      const isSelected = currentFilter.makers.includes(slug);
      const newMakers = isSelected
        ? currentFilter.makers.filter((m) => m !== slug)
        : [...currentFilter.makers, slug];
      updateFilter({ ...currentFilter, makers: newMakers });
    },
    [currentFilter, updateFilter]
  );

  // 特徴 toggle
  const handleFeatureToggle = useCallback(
    (slug: string) => {
      const isSelected = currentFilter.features.includes(slug);
      const newFeatures = isSelected
        ? currentFilter.features.filter((f) => f !== slug)
        : [...currentFilter.features, slug];
      updateFilter({ ...currentFilter, features: newFeatures });
    },
    [currentFilter, updateFilter]
  );

  // 都道府県 toggle（単一選択）
  const handlePrefToggle = useCallback(
    (slug: string) => {
      const isSelected = currentFilter.pref === slug;
      // pref 変更時は city をクリア
      updateFilter({
        ...currentFilter,
        pref: isSelected ? '' : slug,
        city: '',
      });
    },
    [currentFilter, updateFilter]
  );

  // 市区町村 toggle（単一選択）
  const handleCityToggle = useCallback(
    (slug: string) => {
      const isSelected = currentFilter.city === slug;
      updateFilter({
        ...currentFilter,
        city: isSelected ? '' : slug,
      });
    },
    [currentFilter, updateFilter]
  );

  // 価格
  const handlePriceApply = useCallback(
    (min: string, max: string) => {
      updateFilter({ ...currentFilter, min, max });
    },
    [currentFilter, updateFilter]
  );

  // 価格変動
  const handlePriceChangedToggle = useCallback(() => {
    updateFilter({ ...currentFilter, priceChanged: !currentFilter.priceChanged });
  }, [currentFilter, updateFilter]);

  // ============================================
  // チップ削除ハンドラ
  // ============================================

  const handleRemoveMaker = useCallback(
    (slug: string) => {
      updateFilter({
        ...currentFilter,
        makers: currentFilter.makers.filter((m) => m !== slug),
      });
    },
    [currentFilter, updateFilter]
  );

  const handleRemoveFeature = useCallback(
    (slug: string) => {
      updateFilter({
        ...currentFilter,
        features: currentFilter.features.filter((f) => f !== slug),
      });
    },
    [currentFilter, updateFilter]
  );

  const handleRemovePref = useCallback(() => {
    updateFilter({ ...currentFilter, pref: '', city: '' });
  }, [currentFilter, updateFilter]);

  const handleRemoveCity = useCallback(() => {
    updateFilter({ ...currentFilter, city: '' });
  }, [currentFilter, updateFilter]);

  const handleRemovePrice = useCallback(() => {
    updateFilter({ ...currentFilter, min: '', max: '' });
  }, [currentFilter, updateFilter]);

  const handleRemovePriceChanged = useCallback(() => {
    updateFilter({ ...currentFilter, priceChanged: false });
  }, [currentFilter, updateFilter]);

  const handleClearAll = useCallback(() => {
    pushFilterReset(router, { q: currentQ, sort: currentSort });
  }, [router, currentQ, currentSort]);

  // ============================================
  // レンダリング
  // ============================================

  // PC版で閉じている場合は表示しない
  if (!isModalMode && !isOpen) {
    return null;
  }

  const filtersContent = (
    <>
      {/* 選択済み条件チップ */}
      {!isFilterEmpty(currentFilter) && (
        <SelectedFiltersChips
          filter={currentFilter}
          makers={masterMakers}
          prefs={masterPrefs}
          prefToCities={masterPrefToCities}
          onRemoveMaker={handleRemoveMaker}
          onRemoveFeature={handleRemoveFeature}
          onRemovePref={handleRemovePref}
          onRemoveCity={handleRemoveCity}
          onRemovePrice={handleRemovePrice}
          onRemovePriceChanged={handleRemovePriceChanged}
          onClearAll={handleClearAll}
        />
      )}

      {/* メーカー */}
      <FacetSection
        title="メーカー"
        items={makerItems}
        selectedSlugs={currentFilter.makers}
        onToggle={handleMakerToggle}
        multiSelect={true}
      />

      {/* 特徴 */}
      <FacetSection
        title="特徴"
        items={featureItems}
        selectedSlugs={currentFilter.features}
        onToggle={handleFeatureToggle}
        multiSelect={true}
      />

      {/* 都道府県 */}
      <FacetSection
        title="都道府県"
        items={prefItems}
        selectedSlugs={currentFilter.pref ? [currentFilter.pref] : []}
        onToggle={handlePrefToggle}
        multiSelect={false}
      />

      {/* 市区町村 */}
      <FacetSection
        title="市区町村"
        items={cityItems}
        selectedSlugs={currentFilter.city ? [currentFilter.city] : []}
        onToggle={handleCityToggle}
        multiSelect={false}
        disabled={!currentFilter.pref}
        disabledMessage="まず都道府県を選択してください"
      />

      {/* 価格 */}
      <PriceRangeInput
        min={currentFilter.min}
        max={currentFilter.max}
        onApply={handlePriceApply}
      />

      {/* 価格変動 */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={currentFilter.priceChanged}
            onChange={handlePriceChangedToggle}
            className="accent-blue-600"
          />
          <span className={currentFilter.priceChanged ? 'text-blue-600 font-medium' : 'text-gray-700'}>
            価格変動ありのみ
          </span>
        </label>
      </div>
    </>
  );

  // モーダルモード（モバイル）
  if (isModalMode) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
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
    <>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-sm md:text-base font-medium text-gray-800">絞り込み検索</h2>
      </div>
      {filtersContent}
    </>
  );
}
