/**
 * Vertex AI Search filter 文字列の組み立て
 */

import type { SearchQuery } from '../searchClient';

/**
 * slug 値をエスケープ（" を \" に）
 */
function escapeSlug(value: string): string {
  return value.replace(/"/g, '\\"');
}

/**
 * 複数値を ANY("a","b","c") 形式に変換
 */
function buildAnyFilter(field: string, values: string[]): string | null {
  const escaped = values
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .map((v) => `"${escapeSlug(v)}"`);

  if (escaped.length === 0) return null;
  return `${field}: ANY(${escaped.join(',')})`;
}

/**
 * SearchQuery から Vertex AI Search の filter 文字列を生成
 *
 * フィルタ形式:
 * - maker/model/pref/city: `${field}Slug: ANY("value")`
 * - feature: `featureSlugs: ANY("value")` を複数 `AND` で連結（複数AND）
 * - price: `priceYen: IN(minYen, maxYen)`
 *
 * @returns filter 文字列。条件がなければ undefined
 */
export function buildFilter(query: SearchQuery): string | undefined {
  const conditions: string[] = [];

  // shop（店舗ページ用）
  if (query.shop) {
    conditions.push(`shop: ANY("${escapeSlug(query.shop)}")`);
  }

  // id（車両詳細用）
  if (query.id) {
    // ID は英数字とハイフンのみ想定（car-000054 等）
    conditions.push(`id: ANY("${escapeSlug(query.id)}")`);
  }

  // makerSlug（複数対応：makerSlugs 優先、なければ makerSlug）
  const makerValues = query.makerSlugs?.length ? query.makerSlugs : query.makerSlug ? [query.makerSlug] : [];
  const makerFilter = buildAnyFilter('makerSlug', makerValues);
  if (makerFilter) {
    conditions.push(makerFilter);
  }

  // modelSlug
  if (query.modelSlug) {
    conditions.push(`modelSlug: ANY("${escapeSlug(query.modelSlug)}")`);
  }

  // prefSlug
  if (query.prefSlug) {
    conditions.push(`prefSlug: ANY("${escapeSlug(query.prefSlug)}")`);
  }

  // citySlug
  if (query.citySlug) {
    conditions.push(`citySlug: ANY("${escapeSlug(query.citySlug)}")`);
  }

  // featureSlugs（複数対応：featureSlugs 優先、なければ featureSlug）
  const featureValues = query.featureSlugs?.length ? query.featureSlugs : query.featureSlug ? [query.featureSlug] : [];
  // NOTE: feature は「全部含む（AND）」が自然なので、複数指定時は ANY を AND で連結する。
  // 例: feat=a&feat=b -> featureSlugs: ANY("a") AND featureSlugs: ANY("b")
  const featureValuesNormalized = Array.from(
    new Set(
      featureValues
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
    ),
  );
  if (featureValuesNormalized.length === 1) {
    const single = buildAnyFilter('featureSlugs', featureValuesNormalized);
    if (single) conditions.push(single);
  } else if (featureValuesNormalized.length > 1) {
    for (const v of featureValuesNormalized) {
      conditions.push(`featureSlugs: ANY("${escapeSlug(v)}")`);
    }
  }

  // 価格レンジ（万円 → 円変換）
  // IN(min, max) を採用（疎通成功済み）
  const minYen = query.minMan ? Number(query.minMan) * 10000 : null;
  const maxYen = query.maxMan ? Number(query.maxMan) * 10000 : null;

  if (minYen !== null && maxYen !== null && Number.isFinite(minYen) && Number.isFinite(maxYen)) {
    // 両方指定: IN(min, max)
    conditions.push(`priceYen: IN(${minYen}, ${maxYen})`);
  } else if (minYen !== null && Number.isFinite(minYen)) {
    // 下限のみ: >= 演算子
    conditions.push(`priceYen >= ${minYen}`);
  } else if (maxYen !== null && Number.isFinite(maxYen)) {
    // 上限のみ: <= 演算子
    conditions.push(`priceYen <= ${maxYen}`);
  }

  // Note: priceChangedOnly filter has been removed

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.join(' AND ');
}
