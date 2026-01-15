// src\pages\api\search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Car } from '@/types';
import { getSearchClient, type SearchResult, type SearchQuery } from '@/server/search/searchClient';
import { parseSearchQuery } from '@/server/search/parseParams';

// 検索APIハンドラー（HTTP層のみ）
// 将来的にカーセンサーAPIに置き換える予定
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResult | { error: string }>
) {
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  (async () => {
    try {
      const query: SearchQuery = parseSearchQuery(req.query);
      const client = getSearchClient();
      const result = await client.search(query);

      // NOTE: do not infer totalCount from items.length
      res.status(200).json({
        items: result.items as Car[],
        totalCount: result.totalCount,
        lastUpdatedAt: result.lastUpdatedAt,
      });
    } catch (error) {
      console.error('Search API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })();
}
