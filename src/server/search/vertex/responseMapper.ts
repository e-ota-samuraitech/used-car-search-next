/**
 * Vertex AI Search structData → Car の型安全変換
 */

import type { Car } from '@/types';

/**
 * unknown から string を取得（必須）
 */
function getString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

/**
 * unknown から string を取得（任意）
 */
function getOptionalString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  if (typeof value === 'string' && value !== '') {
    return value;
  }
  return undefined;
}

/**
 * unknown から number を取得（必須）
 */
function getNumber(obj: Record<string, unknown>, key: string): number | null {
  const value = obj[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

/**
 * unknown から number を取得（任意、デフォルト値あり）
 */
function getNumberWithDefault(obj: Record<string, unknown>, key: string, defaultValue: number): number {
  const value = obj[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return defaultValue;
}

/**
 * unknown から number | null を取得
 */
function getNumberOrNull(obj: Record<string, unknown>, key: string): number | null {
  const value = obj[key];
  if (value === null) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

/**
 * unknown から boolean を取得（デフォルト false）
 */
function getBoolean(obj: Record<string, unknown>, key: string): boolean {
  const value = obj[key];
  if (typeof value === 'boolean') {
    return value;
  }
  return false;
}

/**
 * unknown から string[] を取得（任意）
 */
function getOptionalStringArray(obj: Record<string, unknown>, key: string): string[] | undefined {
  const value = obj[key];
  if (Array.isArray(value)) {
    const strings = value.filter((v): v is string => typeof v === 'string');
    return strings.length > 0 ? strings : undefined;
  }
  return undefined;
}

/**
 * structData を Car に変換
 *
 * @param structData Vertex AI Search から返された structData
 * @returns 変換成功時は Car、必須フィールド欠損時は null
 */
export function mapStructDataToCar(structData: unknown): Car | null {
  if (structData === null || typeof structData !== 'object') {
    return null;
  }

  const data = structData as Record<string, unknown>;

  // 必須フィールドのチェック
  const id = getString(data, 'id');
  const maker = getString(data, 'maker');
  const model = getString(data, 'model');
  const year = getNumber(data, 'year');
  const mileage = getNumber(data, 'mileage');
  const pref = getString(data, 'pref');
  const city = getString(data, 'city');
  const priceYen = getNumber(data, 'priceYen');
  const updatedAt = getNumber(data, 'updatedAt');

  // 必須フィールドのいずれかが欠損している場合は null を返す
  if (
    id === null ||
    maker === null ||
    model === null ||
    year === null ||
    mileage === null ||
    pref === null ||
    city === null ||
    priceYen === null ||
    updatedAt === null
  ) {
    return null;
  }

  // Car オブジェクトを構築
  const car: Car = {
    id,
    maker,
    model,
    year,
    mileage,
    hasRepairHistory: getBoolean(data, 'hasRepairHistory'),
    hasInspection: getBoolean(data, 'hasInspection'),
    shaken: getOptionalString(data, 'shaken') ?? '',
    warranty: getOptionalString(data, 'warranty') ?? '',
    region: getOptionalString(data, 'region') ?? '',
    pref,
    city,
    priceYen,
    prevPriceYen: getNumberWithDefault(data, 'prevPriceYen', priceYen),
    updatedAt,
    postedAt: getNumberWithDefault(data, 'postedAt', updatedAt),
    priceChangedAt: getNumberOrNull(data, 'priceChangedAt'),
    shop: getOptionalString(data, 'shop') ?? '',
    // optional fields
    makerSlug: getOptionalString(data, 'makerSlug'),
    modelSlug: getOptionalString(data, 'modelSlug'),
    prefSlug: getOptionalString(data, 'prefSlug'),
    citySlug: getOptionalString(data, 'citySlug'),
    featureSlugs: getOptionalStringArray(data, 'featureSlugs'),
  };

  return car;
}

/**
 * 欠損した必須フィールドを特定（デバッグ用）
 */
export function getMissingRequiredFields(structData: unknown): string[] {
  if (structData === null || typeof structData !== 'object') {
    return ['(structData is not an object)'];
  }

  const data = structData as Record<string, unknown>;
  const missing: string[] = [];

  const requiredStringFields = ['id', 'maker', 'model', 'pref', 'city'];
  const requiredNumberFields = ['year', 'mileage', 'priceYen', 'updatedAt'];

  for (const field of requiredStringFields) {
    if (typeof data[field] !== 'string') {
      missing.push(field);
    }
  }

  for (const field of requiredNumberFields) {
    if (typeof data[field] !== 'number' || !Number.isFinite(data[field] as number)) {
      missing.push(field);
    }
  }

  return missing;
}
