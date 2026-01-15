import { useMemo } from 'react';
import { mockCarDatabase } from '@/lib/mockCars';
import { withinDays } from '@/utils/helpers';

interface GeoFiltersResult {
  prefToCities: Record<string, Array<{ slug: string; name: string }>>;
  prefs: Array<{ slug: string; name: string }>;
  makers: Array<{ slug: string; name: string }>;
}

export const useGeoFilters = (): GeoFiltersResult => {
  // 都道府県/市区町村/メーカーのインデックスを構築（slug前提）
  const { prefToCities, prefs, makers } = useMemo(() => {
    const fresh = mockCarDatabase.filter(c => withinDays(c.updatedAt, 30));

    const makersMap = new Map<string, string>();
    const prefsMap = new Map<string, string>();
    const prefToCitiesMap = new Map<string, Map<string, string>>();

    fresh.forEach(c => {
      if (c.makerSlug) makersMap.set(c.makerSlug, c.maker);
      if (c.prefSlug) prefsMap.set(c.prefSlug, c.pref);

      if (c.prefSlug && c.citySlug) {
        if (!prefToCitiesMap.has(c.prefSlug)) {
          prefToCitiesMap.set(c.prefSlug, new Map());
        }
        prefToCitiesMap.get(c.prefSlug)!.set(c.citySlug, c.city);
      }
    });

    const makers = Array.from(makersMap.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    const prefs = Array.from(prefsMap.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    const prefToCities: Record<string, Array<{ slug: string; name: string }>> = {};
    Array.from(prefToCitiesMap.entries()).forEach(([prefSlug, citiesMap]) => {
      prefToCities[prefSlug] = Array.from(citiesMap.entries())
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    });

    return { prefToCities, prefs, makers };
  }, []);

  return { prefToCities, prefs, makers };
};
