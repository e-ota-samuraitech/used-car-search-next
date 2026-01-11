import type { Car } from '@/types';
import type { SearchParams } from './types';
import type { ICarDataSource } from './dataSource/interface';

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

  // 30日以内に更新されたデータのみ
  results = results.filter(car => withinDays(car.updatedAt, 30));

  // メーカーフィルタ
  if (params.maker && params.maker !== '') {
    results = results.filter(car => car.maker === params.maker);
  }

  // 地域フィルタ
  if (params.region && params.region !== '') {
    results = results.filter(car => car.region === params.region);
  }

  // 都道府県フィルタ
  if (params.pref && params.pref !== '') {
    results = results.filter(car => car.pref === params.pref);
  }

  // 市区町村フィルタ
  if (params.city && params.city !== '') {
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

  // 価格変動ありのみ
  if (params.priceChangedOnly) {
    results = results.filter(car => car.prevPriceYen !== car.priceYen);
  }

  // キーワード検索（モデル名・メーカー名に含まれるか）
  if (params.q && params.q !== '') {
    const keyword = params.q.toLowerCase();
    results = results.filter(car =>
      car.model.toLowerCase().includes(keyword) ||
      car.maker.toLowerCase().includes(keyword)
    );
  }

  return results;
}
