// src\pages\api\search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { mockCarDatabase } from '@/lib/mockCars';
import type { Car } from '@/types';

// 指定日数以内に更新されたかチェック
const withinDays = (timestamp: number, days: number): boolean => {
  const diff = Date.now() - timestamp;
  return diff < days * 24 * 60 * 60 * 1000;
};

// 検索APIハンドラー
// 将来的にカーセンサーAPIに置き換える予定
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ items: Car[] } | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // クエリパラメータを取得
    const {
      q = '',
      maker = '',
      region = '',
      pref = '',
      city = '',
      minMan = '',
      maxMan = '',
      priceChangedOnly = 'false'
    } = req.query;

    // 30日以内に更新されたデータのみ取得
    let results = mockCarDatabase.filter(car => withinDays(car.updatedAt, 30));

    // フィルタリング
    if (maker && maker !== '') {
      results = results.filter(car => car.maker === maker);
    }

    if (region && region !== '') {
      results = results.filter(car => car.region === region);
    }

    if (pref && pref !== '') {
      results = results.filter(car => car.pref === pref);
    }

    if (city && city !== '') {
      results = results.filter(car => car.city === city);
    }

    // 価格フィルター（万円 → 円に変換）
    if (minMan && minMan !== '') {
      const minPrice = Number(minMan) * 10000;
      results = results.filter(car => car.priceYen >= minPrice);
    }

    if (maxMan && maxMan !== '') {
      const maxPrice = Number(maxMan) * 10000;
      results = results.filter(car => car.priceYen <= maxPrice);
    }

    // 価格変動ありのみ
    if (priceChangedOnly === 'true') {
      results = results.filter(car => car.prevPriceYen !== car.priceYen);
    }

    // キーワード検索（モデル名に含まれるか）
    if (q && q !== '') {
      const keyword = String(q).toLowerCase();
      results = results.filter(car =>
        car.model.toLowerCase().includes(keyword) ||
        car.maker.toLowerCase().includes(keyword)
      );
    }

    return res.status(200).json({ items: results });
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
