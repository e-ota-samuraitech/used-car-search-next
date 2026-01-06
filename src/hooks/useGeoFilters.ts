import { useMemo } from 'react';
import { carPool } from '@/utils/data';
import { withinDays } from '@/utils/helpers';

interface GeoFiltersResult {
  regionToPrefs: Record<string, string[]>;
  prefToCities: Record<string, string[]>;
  makers: string[];
  regions: string[];
}

export const useGeoFilters = (): GeoFiltersResult => {
  // 地域/都道府県/市区町村のインデックスを構築
  const { regionToPrefs, prefToCities, makers, regions } = useMemo(() => {
    const fresh = carPool.filter(c => withinDays(c.updatedAt, 30));

    const regionToPrefsMap: Record<string, Set<string>> = {};
    const prefToCitiesMap: Record<string, Set<string>> = {};

    fresh.forEach(c => {
      if (!regionToPrefsMap[c.region]) regionToPrefsMap[c.region] = new Set();
      regionToPrefsMap[c.region].add(c.pref);

      if (!prefToCitiesMap[c.pref]) prefToCitiesMap[c.pref] = new Set();
      prefToCitiesMap[c.pref].add(c.city);
    });

    // Set を Array に変換してソート
    const regionToPrefs: Record<string, string[]> = {};
    Object.keys(regionToPrefsMap).forEach(k => {
      regionToPrefs[k] = Array.from(regionToPrefsMap[k]).sort();
    });

    const prefToCities: Record<string, string[]> = {};
    Object.keys(prefToCitiesMap).forEach(k => {
      prefToCities[k] = Array.from(prefToCitiesMap[k]).sort();
    });

    const makers = Array.from(new Set(fresh.map(c => c.maker))).sort();
    const regions = Array.from(new Set(fresh.map(c => c.region))).sort();

    return { regionToPrefs, prefToCities, makers, regions };
  }, []);

  return { regionToPrefs, prefToCities, makers, regions };
};
