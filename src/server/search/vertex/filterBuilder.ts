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
 * SearchQuery から Vertex AI Search の filter 文字列を生成
 *
 * フィルタ形式:
 * - maker/model/pref/city: `${field}Slug: ANY("value")`
 * - feature: `featureSlugs: ANY("value")`
 * - price: `priceYen: IN(minYen, maxYen)`
 * - priceChangedOnly: `priceChanged = 1`
 *
 * @returns filter 文字列。条件がなければ undefined
 */
export function buildFilter(query: SearchQuery): string | undefined {
  const conditions: string[] = [];

  // makerSlug
  if (query.makerSlug) {
    conditions.push(`makerSlug: ANY("${escapeSlug(query.makerSlug)}")`);
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

  // featureSlugs（配列フィールド）
  if (query.featureSlug) {
    conditions.push(`featureSlugs: ANY("${escapeSlug(query.featureSlug)}")`);
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

  // priceChangedOnly: 派生フィールド priceChanged = 1
  if (query.priceChangedOnly) {
    conditions.push(`priceChanged = 1`);
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.join(' AND ');
}
