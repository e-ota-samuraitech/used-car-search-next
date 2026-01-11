// src\pages\api\search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Car } from '@/types';
import { parseSearchParams } from '@/server/search/parseParams';
import { searchCars } from '@/server/search/searchService';
import { MockCarDataSource } from '@/server/search/dataSource/mockDataSource';

// 検索APIハンドラー（HTTP層のみ）
// 将来的にカーセンサーAPIに置き換える予定
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ items: Car[] } | { error: string }>
) {
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // クエリパラメータを正規化
    const params = parseSearchParams(req.query);

    // データソースを初期化（将来的にカーセンサーAPI等に差し替え）
    const dataSource = new MockCarDataSource();

    // 検索実行
    const results = searchCars(params, dataSource);

    return res.status(200).json({ items: results });
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
