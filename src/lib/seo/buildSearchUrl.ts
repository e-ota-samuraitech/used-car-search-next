import type { Pathname } from './types';
import { URL_PREFIXES } from './config';
import { evaluateKeywordUpgrade } from './keyword';

export interface SearchUrlParams {
  q?: string;

  // slug filters (spec: do not put Japanese in URL)
  makerSlug?: string;
  modelSlug?: string;
  prefSlug?: string;
  citySlug?: string;
  featureSlug?: string;

  // fine filters (always /results)
  minMan?: string;
  maxMan?: string;
  priceChangedOnly?: boolean;

  // non-canonical params
  sort?: string;
  page?: number;
}

export interface BuildSearchUrlResult {
  url: string;
  destination: 'cars' | 'results';
  pathname: Pathname;
  queryParams: URLSearchParams;
}

function normalizeTrim(value: string | undefined): string {
  return (value ?? '').trim();
}

function isValidSlugValue(slug: string | undefined): slug is string {
  return !!slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function addIfPresent(params: URLSearchParams, key: string, value: string | undefined) {
  const v = normalizeTrim(value);
  if (v) params.set(key, v);
}

/**
 * Decide navigation URL strictly by docs/spec-seo.md.
 * - Only spec-listed canonical short URL patterns may use /cars.
 * - Otherwise navigate to /results and preserve ALL conditions in query.
 */
export function buildSearchUrl(input: SearchUrlParams): BuildSearchUrlResult {
  // Normalize inputs
  let q = normalizeTrim(input.q);

  let makerSlug = normalizeTrim(input.makerSlug).toLowerCase();
  let modelSlug = normalizeTrim(input.modelSlug).toLowerCase();
  let prefSlug = normalizeTrim(input.prefSlug).toLowerCase();
  let citySlug = normalizeTrim(input.citySlug).toLowerCase();
  let featureSlug = normalizeTrim(input.featureSlug).toLowerCase();

  const minMan = normalizeTrim(input.minMan);
  const maxMan = normalizeTrim(input.maxMan);
  const priceChangedOnly = !!input.priceChangedOnly;
  const sort = normalizeTrim(input.sort);
  const page = input.page;

  // q can be "upgraded" into a canonical slug condition (maker/model/feature/pref/city).
  // If so, we treat it as structured intent (not an extra condition).
  if (q) {
    const upgrade = evaluateKeywordUpgrade(q);
    if (upgrade.canUpgrade && upgrade.detected) {
      const conflicts =
        (upgrade.detected.makerSlug && makerSlug && makerSlug !== upgrade.detected.makerSlug) ||
        (upgrade.detected.modelSlug && modelSlug && modelSlug !== upgrade.detected.modelSlug) ||
        (upgrade.detected.prefSlug && prefSlug && prefSlug !== upgrade.detected.prefSlug) ||
        (upgrade.detected.citySlug && citySlug && citySlug !== upgrade.detected.citySlug) ||
        (upgrade.detected.featureSlug && featureSlug && featureSlug !== upgrade.detected.featureSlug);

      if (!conflicts) {
        if (upgrade.detected.makerSlug && !makerSlug) makerSlug = upgrade.detected.makerSlug;
        if (upgrade.detected.modelSlug && !modelSlug) modelSlug = upgrade.detected.modelSlug;
        if (upgrade.detected.prefSlug && !prefSlug) prefSlug = upgrade.detected.prefSlug;
        if (upgrade.detected.citySlug && !citySlug) citySlug = upgrade.detected.citySlug;
        if (upgrade.detected.featureSlug && !featureSlug) featureSlug = upgrade.detected.featureSlug;
        q = '';
      }
    }
  }

  // Validate slugs; if invalid, keep them only in /results.
  const validMakerSlug = isValidSlugValue(makerSlug) ? makerSlug : '';
  const validModelSlug = isValidSlugValue(modelSlug) ? modelSlug : '';
  const validPrefSlug = isValidSlugValue(prefSlug) ? prefSlug : '';
  const validCitySlug = isValidSlugValue(citySlug) ? citySlug : '';
  const validFeatureSlug = isValidSlugValue(featureSlug) ? featureSlug : '';

  const hasFineFilters = !!minMan || !!maxMan || priceChangedOnly;
  const hasNonCanonical = !!sort || (typeof page === 'number' && page > 1);
  const hasFreeword = !!q;

  // /cars is allowed ONLY when the set of conditions exactly matches one spec pattern.
  // Any extra condition => /results.
  if (!hasFineFilters && !hasNonCanonical && !hasFreeword) {
    const hasPref = !!validPrefSlug;
    const hasCity = !!validCitySlug;
    const hasMaker = !!validMakerSlug;
    const hasModel = !!validModelSlug;
    const hasFeature = !!validFeatureSlug;

    // Guard against invalid partials (these are not spec patterns)
    if ((hasCity && !hasPref) || (hasModel && !hasMaker)) {
      // fallthrough to /results
    } else {
      let pathname: Pathname | null = null;

      // spec patterns (exact match)
      if (hasPref && hasCity && hasMaker && !hasModel && !hasFeature) {
        pathname = `/cars/${URL_PREFIXES.PREF}${validPrefSlug}/${URL_PREFIXES.CITY}${validCitySlug}/${URL_PREFIXES.MAKER}${validMakerSlug}/` as Pathname;
      } else if (hasPref && hasFeature && !hasCity && !hasMaker && !hasModel) {
        pathname = `/cars/${URL_PREFIXES.PREF}${validPrefSlug}/${URL_PREFIXES.FEATURE}${validFeatureSlug}/` as Pathname;
      } else if (hasFeature && !hasPref && !hasCity && !hasMaker && !hasModel) {
        pathname = `/cars/${URL_PREFIXES.FEATURE}${validFeatureSlug}/` as Pathname;
      } else if (hasPref && hasCity && !hasMaker && !hasModel && !hasFeature) {
        pathname = `/cars/${URL_PREFIXES.PREF}${validPrefSlug}/${URL_PREFIXES.CITY}${validCitySlug}/` as Pathname;
      } else if (hasPref && hasMaker && !hasCity && !hasModel && !hasFeature) {
        pathname = `/cars/${URL_PREFIXES.PREF}${validPrefSlug}/${URL_PREFIXES.MAKER}${validMakerSlug}/` as Pathname;
      } else if (hasPref && !hasCity && !hasMaker && !hasModel && !hasFeature) {
        pathname = `/cars/${URL_PREFIXES.PREF}${validPrefSlug}/` as Pathname;
      } else if (hasMaker && hasModel && !hasPref && !hasCity && !hasFeature) {
        pathname = `/cars/${URL_PREFIXES.MAKER}${validMakerSlug}/${URL_PREFIXES.MODEL}${validModelSlug}/` as Pathname;
      } else if (hasMaker && !hasPref && !hasCity && !hasModel && !hasFeature) {
        pathname = `/cars/${URL_PREFIXES.MAKER}${validMakerSlug}/` as Pathname;
      }

      if (pathname) {
        return {
          url: pathname,
          destination: 'cars',
          pathname,
          queryParams: new URLSearchParams(),
        };
      }
    }
  }

  // Otherwise: /results with ALL conditions preserved
  const queryParams = new URLSearchParams();

  addIfPresent(queryParams, 'q', q);

  // Use slug-only keys per current convention
  addIfPresent(queryParams, 'pref', validPrefSlug || prefSlug);
  addIfPresent(queryParams, 'city', validCitySlug || citySlug);
  addIfPresent(queryParams, 'maker', validMakerSlug || makerSlug);
  addIfPresent(queryParams, 'model', validModelSlug || modelSlug);
  addIfPresent(queryParams, 'feature', validFeatureSlug || featureSlug);

  addIfPresent(queryParams, 'minMan', minMan);
  addIfPresent(queryParams, 'maxMan', maxMan);

  if (priceChangedOnly) queryParams.set('priceChangedOnly', 'true');
  if (sort) queryParams.set('sort', sort);
  if (typeof page === 'number' && page > 1) queryParams.set('page', String(page));

  const pathname = '/results' as Pathname;
  const qs = queryParams.toString();
  const url = qs ? `${pathname}?${qs}` : pathname;

  return {
    url,
    destination: 'results',
    pathname,
    queryParams,
  };
}
