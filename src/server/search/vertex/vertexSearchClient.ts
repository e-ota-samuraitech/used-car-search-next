/**
 * Vertex AI Search (Discovery Engine) を使用した SearchClient 実装
 */

import { SearchServiceClient } from '@google-cloud/discoveryengine';
import type { Car } from '@/types';
import type { SearchClient, SearchQuery, SearchResult, SearchSort } from '../searchClient';
import { DEFAULT_PAGE_SIZE } from '../config';
import { buildFilter } from './filterBuilder';
import { mapStructDataToCar, getMissingRequiredFields } from './responseMapper';

/**
 * pageSize を 1..100 に clamp
 */
function clampPageSize(value: number | undefined): number {
  const size = typeof value === 'number' && Number.isFinite(value) ? value : DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.min(size, 100));
}

/**
 * sort を orderBy 文字列に変換
 */
function sortToOrderBy(sort: SearchSort | undefined): string | undefined {
  switch (sort) {
    case 'updated_desc':
      return 'updatedAt desc';
    case 'price_asc':
      return 'priceYen asc';
    case 'price_desc':
      return 'priceYen desc';
    case 'live':
      // live（おすすめ順）は複合ソートが必要だが、Vertex では単一フィールドのみ
      // フォールバックとして updated_desc を使用
      return 'updatedAt desc';
    default:
      return undefined;
  }
}

/**
 * items から lastUpdatedAt を算出（既存ロジックと同等）
 */
function computeLastUpdatedAtIso(items: Car[]): string | undefined {
  let max = 0;
  for (const item of items) {
    if (typeof item.updatedAt === 'number' && item.updatedAt > max) {
      max = item.updatedAt;
    }
  }
  return max > 0 ? new Date(max).toISOString() : undefined;
}

/**
 * デバッグログを出力するかどうか
 */
function shouldLogDebug(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug';
}

export class VertexSearchClient implements SearchClient {
  private readonly client: SearchServiceClient;
  private readonly servingConfig: string;

  constructor(servingConfig: string) {
    this.servingConfig = servingConfig;
    this.client = new SearchServiceClient();
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const pageSize = clampPageSize(query.pageSize);
    const page = typeof query.page === 'number' && query.page > 0 ? query.page : 1;
    const offset = (page - 1) * pageSize;
    const filter = buildFilter(query);
    const orderBy = sortToOrderBy(query.sort);

    if (shouldLogDebug()) {
      console.log('[VertexSearchClient] search request:', {
        query: query.q ?? '',
        pageSize,
        offset,
        filter,
        orderBy,
      });
    }

    const startTime = Date.now();

    try {
      // search() returns [results[], request, response]
      const [results, , response] = await this.client.search({
        servingConfig: this.servingConfig,
        query: query.q ?? '',
        pageSize,
        offset,
        filter,
        orderBy,
      });

      const elapsed = Date.now() - startTime;

      // results を Car[] に変換
      const items: Car[] = [];

      for (const result of results) {
        // result.document.structData を取得
        const document = result.document;
        if (!document) {
          continue;
        }

        // structData は protobuf Struct 型で返される
        // fields プロパティから値を抽出する必要がある
        const structData = extractStructData(document.structData);
        if (!structData) {
          continue;
        }

        const car = mapStructDataToCar(structData);
        if (car) {
          items.push(car);
        } else {
          // 必須フィールド欠損の警告
          const docId = typeof structData === 'object' && structData !== null
            ? (structData as Record<string, unknown>)['id']
            : 'unknown';
          const missing = getMissingRequiredFields(structData);
          console.warn(`[VertexSearchClient] skipping document ${docId}: missing fields [${missing.join(', ')}]`);
        }
      }

      // totalCount の取得（response から）
      // totalSize は Long 型で返される可能性がある
      let totalCount: number;
      const rawTotalSize = response?.totalSize;
      if (typeof rawTotalSize === 'number') {
        totalCount = rawTotalSize;
      } else if (rawTotalSize !== null && rawTotalSize !== undefined) {
        // Long 型の場合
        const asLong = rawTotalSize as unknown as { toNumber?: () => number };
        if (typeof asLong.toNumber === 'function') {
          totalCount = asLong.toNumber();
        } else {
          // Number に変換を試みる
          totalCount = Number(rawTotalSize);
          if (!Number.isFinite(totalCount)) {
            console.warn('[VertexSearchClient] totalSize conversion failed, using items.length');
            totalCount = items.length;
          }
        }
      } else {
        console.warn('[VertexSearchClient] totalSize not available, using items.length');
        totalCount = items.length;
      }

      if (shouldLogDebug()) {
        console.log('[VertexSearchClient] search response:', {
          totalSize: totalCount,
          resultsCount: results.length,
          itemsCount: items.length,
          elapsedMs: elapsed,
        });
      }

      return {
        items,
        totalCount,
        lastUpdatedAt: computeLastUpdatedAtIso(items),
      };
    } catch (error) {
      console.error('[VertexSearchClient] search error:', error);
      throw error;
    }
  }
}

/**
 * protobuf Struct から JavaScript オブジェクトに変換
 *
 * Discovery Engine の structData は google.protobuf.Struct 型で返される
 * fields プロパティを再帰的に展開する必要がある
 */
function extractStructData(structData: unknown): Record<string, unknown> | null {
  if (!structData || typeof structData !== 'object') {
    return null;
  }

  const struct = structData as Record<string, unknown>;

  // すでに通常のオブジェクトの場合（fields プロパティがない）
  if (!('fields' in struct)) {
    return struct;
  }

  // protobuf Struct 形式の場合
  const fields = struct['fields'];
  if (!fields || typeof fields !== 'object') {
    return null;
  }

  return convertProtobufStruct(fields as Record<string, unknown>);
}

/**
 * protobuf Struct の fields を JavaScript オブジェクトに変換
 */
function convertProtobufStruct(fields: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    result[key] = convertProtobufValue(value);
  }

  return result;
}

/**
 * protobuf Value を JavaScript の値に変換
 */
function convertProtobufValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'object') {
    return value;
  }

  const v = value as Record<string, unknown>;

  // nullValue
  if ('nullValue' in v) {
    return null;
  }

  // numberValue
  if ('numberValue' in v) {
    return v['numberValue'];
  }

  // stringValue
  if ('stringValue' in v) {
    return v['stringValue'];
  }

  // boolValue
  if ('boolValue' in v) {
    return v['boolValue'];
  }

  // structValue (nested object)
  if ('structValue' in v) {
    const nested = v['structValue'] as Record<string, unknown>;
    if (nested && 'fields' in nested) {
      return convertProtobufStruct(nested['fields'] as Record<string, unknown>);
    }
    return null;
  }

  // listValue (array)
  if ('listValue' in v) {
    const listValue = v['listValue'] as Record<string, unknown>;
    if (listValue && 'values' in listValue && Array.isArray(listValue['values'])) {
      return (listValue['values'] as unknown[]).map(convertProtobufValue);
    }
    return [];
  }

  // その他（すでに変換済みの値の可能性）
  return value;
}
