import type { Car } from '@/types';
import type { SearchParams } from './types';
import type { ICarDataSource } from './dataSource/interface';
import { SEARCH_MAX_AGE_DAYS } from './config';

// 指定日数以内に更新されたかチェック
function withinDays(timestamp: number, days: number): boolean {
  const diff = Date.now() - timestamp;
  return diff < days * 24 * 60 * 60 * 1000;
}

// 検索実行（フィルタリング処理）
export function searchCars(
  params: SearchParams,
  dataSource: ICarDataSource
): Car[] {
  // データソースから全データを取得
  let results = dataSource.getAllCars();

  // 指定日数以内に更新されたデータのみ（共通ポリシー）
  results = results.filter(car => withinDays(car.updatedAt, SEARCH_MAX_AGE_DAYS));

  // メーカーフィルタ（slug優先、なければ日本語名で検索）
  if (params.makerSlug && params.makerSlug !== '') {
    results = results.filter(car => car.makerSlug === params.makerSlug);
  } else if (params.maker && params.maker !== '') {
    results = results.filter(car => car.maker === params.maker);
  }

  // 車種フィルタ（slugのみ）
  if (params.modelSlug && params.modelSlug !== '') {
    results = results.filter(car => car.modelSlug === params.modelSlug);
  }

  // feature フィルタ（slug）
  if (params.featureSlug && params.featureSlug !== '') {
    results = results.filter(car => (car.featureSlugs || []).includes(params.featureSlug as string));
  }

  // 都道府県フィルタ（slug優先、なければ日本語名で検索）
  if (params.prefSlug && params.prefSlug !== '') {
    results = results.filter(car => car.prefSlug === params.prefSlug);
  } else if (params.pref && params.pref !== '') {
    results = results.filter(car => car.pref === params.pref);
  }

  // 市区町村フィルタ（slug優先、なければ日本語名で検索）
  if (params.citySlug && params.citySlug !== '') {
    results = results.filter(car => car.citySlug === params.citySlug);
  } else if (params.city && params.city !== '') {
    results = results.filter(car => car.city === params.city);
  }

  // 価格フィルタ（万円 → 円に変換）
  if (params.minMan && params.minMan !== '') {
    const minPrice = Number(params.minMan) * 10000;
    results = results.filter(car => car.priceYen >= minPrice);
  }

  if (params.maxMan && params.maxMan !== '') {
    const maxPrice = Number(params.maxMan) * 10000;
    results = results.filter(car => car.priceYen <= maxPrice);
  }

  // Note: priceChangedOnly filter has been removed

  // キーワード検索（モデル名・メーカー名に含まれるか）
  if (params.q && params.q !== '') {
    const keyword = params.q.toLowerCase();
    results = results.filter(car =>
      car.model.toLowerCase().includes(keyword) ||
      car.maker.toLowerCase().includes(keyword) ||
      car.shop.toLowerCase().includes(keyword)
    );
  }

  return results;
}
