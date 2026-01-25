/**
 * Vertex AI Search (Discovery Engine) を使用した SearchClient 実装
 */

import { SearchServiceClient, protos } from '@google-cloud/discoveryengine';
import type { Car } from '@/types';
import type { SearchClient, SearchQuery, SearchResult, SearchSort, Facet, FacetValue } from '../searchClient';
import { DEFAULT_PAGE_SIZE } from '../config';
import { buildFilter } from './filterBuilder';
import { mapStructDataToCar, getMissingRequiredFields } from './responseMapper';

type DiscoverySearchRequest = Parameters<SearchServiceClient['search']>[0];

type DiscoverySearchResultItem = {
  document?: {
    name?: string;
    structData?: unknown;
  };
  // Discovery Engine may return relevance/model scores
  modelScores?: Record<string, { values?: number[] }>;
};

// ✅ facets を含む “本物の” SearchResponse 型にする
type DiscoverySearchResponse = protos.google.cloud.discoveryengine.v1.SearchResponse;

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

function normalizeQueryString(value: string | undefined): string {
  return (value ?? '').trim();
}

function getEnvString(name: string): string {
  return (process.env[name] ?? '').trim();
}

function parseLanguageCode(): string | undefined {
  // Default to ja-JP, but allow disabling by setting empty string.
  const raw = getEnvString('VERTEX_LANGUAGE_CODE');
  if (raw) return raw;
  return 'ja-JP';
}

function parseQueryExpansionCondition(): protos.google.cloud.discoveryengine.v1.SearchRequest.QueryExpansionSpec.Condition | undefined {
  const raw = getEnvString('VERTEX_QUERY_EXPANSION_CONDITION');
  const value = raw.toUpperCase();
  if (!value) {
    return protos.google.cloud.discoveryengine.v1.SearchRequest.QueryExpansionSpec.Condition.DISABLED;
  }

  switch (value) {
    case 'DISABLED':
      return protos.google.cloud.discoveryengine.v1.SearchRequest.QueryExpansionSpec.Condition.DISABLED;
    case 'AUTO':
      return protos.google.cloud.discoveryengine.v1.SearchRequest.QueryExpansionSpec.Condition.AUTO;
    case 'UNSPECIFIED':
    case 'CONDITION_UNSPECIFIED':
      return protos.google.cloud.discoveryengine.v1.SearchRequest.QueryExpansionSpec.Condition.CONDITION_UNSPECIFIED;
    case 'NONE':
    case 'OFF':
      return undefined;
    default:
      // Unknown value -> keep safe default (disabled)
      return protos.google.cloud.discoveryengine.v1.SearchRequest.QueryExpansionSpec.Condition.DISABLED;
  }
}

function parseSpellCorrectionMode(): protos.google.cloud.discoveryengine.v1.SearchRequest.SpellCorrectionSpec.Mode | undefined {
  const raw = getEnvString('VERTEX_SPELL_CORRECTION_MODE');
  const value = raw.toUpperCase();
  if (!value) {
    return protos.google.cloud.discoveryengine.v1.SearchRequest.SpellCorrectionSpec.Mode.SUGGESTION_ONLY;
  }

  switch (value) {
    case 'SUGGESTION_ONLY':
      return protos.google.cloud.discoveryengine.v1.SearchRequest.SpellCorrectionSpec.Mode.SUGGESTION_ONLY;
    case 'AUTO':
      return protos.google.cloud.discoveryengine.v1.SearchRequest.SpellCorrectionSpec.Mode.AUTO;
    case 'UNSPECIFIED':
    case 'MODE_UNSPECIFIED':
      return protos.google.cloud.discoveryengine.v1.SearchRequest.SpellCorrectionSpec.Mode.MODE_UNSPECIFIED;
    case 'NONE':
    case 'OFF':
      return undefined;
    default:
      // Unknown value -> keep safe default (suggestion only)
      return protos.google.cloud.discoveryengine.v1.SearchRequest.SpellCorrectionSpec.Mode.SUGGESTION_ONLY;
  }
}

function isInvalidArgumentError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;

  // gRPC INVALID_ARGUMENT is code=3
  if (typeof e.code === 'number' && e.code === 3) return true;

  // Some clients surface HTTP status
  if (typeof e.status === 'number' && e.status === 400) return true;

  const message = typeof e.message === 'string' ? e.message : '';
  return message.includes('INVALID_ARGUMENT') || message.includes('InvalidArgument') || message.includes('400');
}

/**
 * VERTEX_STRICT_MODEL_MATCH 環境変数を読み取り
 * "1" or "true" で有効
 */
function isStrictModelMatchEnabled(): boolean {
  const raw = getEnvString('VERTEX_STRICT_MODEL_MATCH').toLowerCase();
  return raw === '1' || raw === 'true';
}

/**
 * クエリが「モデル名っぽい」かを判定
 * - 空白なし
 * - 長さ 2〜10
 * - 記号は - のみ許可（N-BOX 対応）
 */
function isModelLikeQuery(q: string): boolean {
  if (!q) return false;
  // 空白を含む場合は複合クエリとみなす
  if (/\s/.test(q)) return false;
  // 長さチェック
  if (q.length < 2 || q.length > 10) return false;
  // 許可する文字: ひらがな、カタカナ、漢字、英数字、ハイフン
  // 禁止: 空白、その他記号
  if (!/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF66-\uFF9Fa-zA-Z0-9\-ー]+$/.test(q)) return false;
  return true;
}

/**
 * strict フィルタを組み立て（既存 filter に model: ANY("<q>") を追加）
 */
function buildStrictFilter(existingFilter: string | undefined, modelName: string): string {
  const escaped = modelName.replace(/"/g, '\\"');
  const modelFilter = `model: ANY("${escaped}")`;
  if (existingFilter) {
    return `${existingFilter} AND ${modelFilter}`;
  }
  return modelFilter;
}

/**
 * facets デバッグログを出力するか
 * - DEBUG_VERTEX_FACETS=1|true で有効
 * - 本番でも明示的にONなら出る（ただし facets 要約のみ）
 */
function shouldLogFacets(): boolean {
  const raw = getEnvString('DEBUG_VERTEX_FACETS').toLowerCase();
  return raw === '1' || raw === 'true';
}

/**
 * facets を軽量に要約（大量ログ防止）
 */
function summarizeFacets(resp: DiscoverySearchResponse | undefined) {
  const facets = resp?.facets ?? [];
  return facets.map((f: any) => ({
    // 環境/バージョン差異に備えて複数候補を見る
    key: f.key ?? f.facetKey?.key ?? '(unknown)',
    values: (f.values ?? []).slice(0, 10).map((v: any) => ({
      value: v.value,
      count: v.count,
    })),
  }));
}

function getCtorName(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const ctor = (value as any).constructor;
  return typeof ctor?.name === 'string' ? ctor.name : '';
}

function longLikeToNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === null || value === undefined) return undefined;
  const maybe = value as any;
  if (typeof maybe?.toNumber === 'function') {
    const n = maybe.toNumber();
    return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function summarizeFacetSpecs(request: DiscoverySearchRequest): { facetSpecsLen: number; facetKeys: string[] } {
  const facetSpecs = ((request as any)?.facetSpecs ?? []) as any[];
  const keys = facetSpecs
    .map((fs) => fs?.facetKey?.key ?? fs?.facetKey ?? fs?.key)
    .filter((k) => typeof k === 'string' && k.trim().length > 0)
    .map((k) => String(k));
  return { facetSpecsLen: facetSpecs.length, facetKeys: keys };
}

function logVertexReqDump(params: {
  q: string;
  servingConfig: string;
  request: DiscoverySearchRequest;
  label?: string;
}) {
  const { q, servingConfig, request, label } = params;
  const { facetSpecsLen, facetKeys } = summarizeFacetSpecs(request);
  const hasQueryExpansionSpec = (request as any)?.queryExpansionSpec !== undefined;
  const hasSpellCorrectionSpec = (request as any)?.spellCorrectionSpec !== undefined;

  console.log(
    `[VERTEX_REQ_DUMP]${label ? ` label=${label}` : ''} q="${q}" servingConfig=${servingConfig} filter="${(request as any)?.filter ?? ''}" pageSize=${(request as any)?.pageSize ?? ''} offset=${(request as any)?.offset ?? ''} facetSpecsLen=${facetSpecsLen} facetKeys=${JSON.stringify(
      facetKeys,
    )} hasQueryExpansionSpec=${hasQueryExpansionSpec} hasSpellCorrectionSpec=${hasSpellCorrectionSpec}`,
  );
}

function logVertexResShape(params: {
  q: string;
  response: unknown;
  results: unknown;
  label?: string;
}) {
  const { q, response, results, label } = params;
  const type = response === null ? 'null' : typeof response;
  const ctor = getCtorName(response) || '(unknown)';

  const totalSizeRaw = (response as any)?.totalSize;
  const totalSizeNum = longLikeToNumber(totalSizeRaw);
  const hasTotalSize = totalSizeRaw !== undefined;

  const facets = (response as any)?.facets;
  const hasFacets = Array.isArray(facets);
  const facetsLen = hasFacets ? facets.length : undefined;

  const resultsLen = Array.isArray(results) ? results.length : undefined;

  const isArray = Array.isArray(response);
  const isAsyncIterable = typeof (response as any)?.[Symbol.asyncIterator] === 'function';
  const isIterable = typeof (response as any)?.[Symbol.iterator] === 'function';

  console.log(
    `[VERTEX_RES_SHAPE]${label ? ` label=${label}` : ''} q="${q}" type=${type} ctor=${ctor} hasTotalSize=${hasTotalSize} totalSize=${totalSizeNum ?? '(n/a)'} hasFacets=${hasFacets} facetsLen=${facetsLen ?? '(n/a)'} resultsLen=${resultsLen ?? '(n/a)'} isArray=${isArray} isAsyncIterable=${isAsyncIterable} isIterable=${isIterable}`,
  );
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

    const q = normalizeQueryString(query.q);

    // [VERTEX_IN] 入口ログ（常時出力 - Vertexが呼ばれた証拠）
    console.log(`[VERTEX_IN] q="${q}" servingConfig=${this.servingConfig} filter="${filter ?? ''}" pageSize=${pageSize} offset=${offset}`);
    const shouldApplyQueryTuning = q.length > 0;

    const languageCode = shouldApplyQueryTuning ? parseLanguageCode() : undefined;
    const queryExpansionCondition = shouldApplyQueryTuning ? parseQueryExpansionCondition() : undefined;
    const spellCorrectionMode = shouldApplyQueryTuning ? parseSpellCorrectionMode() : undefined;

    // facetSpecs: 絞り込み候補値の取得用
    const facetSpecs = [
      { facetKey: { key: 'makerSlug' }, limit: 200 },
      { facetKey: { key: 'prefSlug' }, limit: 100 },
      { facetKey: { key: 'citySlug' }, limit: 300 },
      { facetKey: { key: 'featureSlugs' }, limit: 50 },
    ];

    const baseRequest: DiscoverySearchRequest = {
      servingConfig: this.servingConfig,
      query: q,
      pageSize,
      offset,
      filter,
      orderBy,
      facetSpecs,
    };

    const tunedRequest: DiscoverySearchRequest = {
      ...baseRequest,
      ...(languageCode ? { languageCode } : {}),
      ...(queryExpansionCondition !== undefined
        ? { queryExpansionSpec: { condition: queryExpansionCondition } }
        : {}),
      ...(spellCorrectionMode !== undefined
        ? { spellCorrectionSpec: { mode: spellCorrectionMode } }
        : {}),
    };

    // strict 検索の判定
    const strictEnabled = isStrictModelMatchEnabled();
    const shouldTryStrict = strictEnabled && q.length > 0 && isModelLikeQuery(q);
    const strictFilter = shouldTryStrict ? buildStrictFilter(filter, q) : undefined;

    if (shouldLogDebug()) {
      console.log('[VertexSearchClient] search request:', {
        servingConfig: this.servingConfig,
        query: q,
        pageSize,
        offset,
        filter,
        orderBy,
        languageCode: languageCode ?? '(none)',
        queryExpansionCondition: queryExpansionCondition ?? '(none)',
        spellCorrectionMode: spellCorrectionMode ?? '(none)',
        strictEnabled,
        shouldTryStrict,
        strictFilter: strictFilter ?? '(none)',
      });
    }

    const startTime = Date.now();

    try {
      // search() returns [results[], request, response]
      let results: DiscoverySearchResultItem[] = [];
      let response: DiscoverySearchResponse | undefined = undefined;
      let usedStrictSearch = false;

      // strict 検索を先に試す（有効 & モデル名っぽい場合）
      if (shouldTryStrict && strictFilter) {
        const strictRequest: DiscoverySearchRequest = {
          ...tunedRequest,
          filter: strictFilter,
        };

        try {
          if (shouldLogDebug()) {
            console.log('[VertexSearchClient] trying strict search with filter:', strictFilter);
          }

          logVertexReqDump({ q, servingConfig: this.servingConfig, request: strictRequest, label: 'strict' });
          // autoPaginate: false で手動ページング（totalSize/facets 取得のため）
          const [r, , resp] = await this.client.search(strictRequest, { autoPaginate: false });
          const strictResults = r as unknown as DiscoverySearchResultItem[];
          const strictResponse = resp as unknown as DiscoverySearchResponse | undefined;

          logVertexResShape({ q, response: strictResponse, results: strictResults, label: 'strict' });

          if (shouldLogFacets()) {
            console.log(
              '[VertexSearchClient][DEBUG] facetSpecs(strict)=',
              JSON.stringify((strictRequest as any).facetSpecs ?? [], null, 2),
            );
            console.log(
              '[VertexSearchClient][DEBUG] facets(strict)=',
              JSON.stringify(summarizeFacets(strictResponse), null, 2),
            );
          }

          // 1件以上あれば strict 検索結果を採用
          if (strictResults.length > 0) {
            results = strictResults;
            response = strictResponse;
            usedStrictSearch = true;
            if (shouldLogDebug()) {
              console.log('[VertexSearchClient] strict search succeeded:', {
                resultsCount: strictResults.length,
              });
            }
          } else {
            // 0件なら通常検索にフォールバック
            if (shouldLogDebug()) {
              console.log('[VertexSearchClient] strict search returned 0 results, falling back to normal search');
            }
          }
        } catch (strictError) {
          // INVALID_ARGUMENT（model が filterable でない等）→ warn して通常検索へ
          if (isInvalidArgumentError(strictError)) {
            console.warn(
              '[VertexSearchClient] strict search failed (INVALID_ARGUMENT), falling back to normal search. Filter was:',
              strictFilter,
            );
          } else {
            // その他のエラーは warn だけ出して通常検索へ
            console.warn('[VertexSearchClient] strict search failed, falling back to normal search:', strictError);
          }
        }
      }

      // strict 検索を使わなかった/失敗した場合、通常検索を実行
      if (!usedStrictSearch) {
        try {
          logVertexReqDump({ q, servingConfig: this.servingConfig, request: tunedRequest, label: 'normal' });
          // autoPaginate: false で手動ページング（totalSize/facets 取得のため）
          const [r, , resp] = await this.client.search(tunedRequest, { autoPaginate: false });
          results = r as unknown as DiscoverySearchResultItem[];
          response = resp as unknown as DiscoverySearchResponse | undefined;

          logVertexResShape({ q, response, results, label: 'normal' });

          if (shouldLogFacets()) {
            console.log(
              '[VertexSearchClient][DEBUG] facetSpecs=',
              JSON.stringify((tunedRequest as any).facetSpecs ?? [], null, 2),
            );
            console.log(
              '[VertexSearchClient][DEBUG] facets=',
              JSON.stringify(summarizeFacets(response), null, 2),
            );
          }
        } catch (error) {
          // If query tuning fields are rejected (e.g., INVALID_ARGUMENT), retry once without them.
          const usedTuningFields = tunedRequest !== baseRequest && shouldApplyQueryTuning;
          if (usedTuningFields && isInvalidArgumentError(error)) {
            console.warn('[VertexSearchClient] search request rejected (invalid argument). Retrying without query tuning fields.');
            logVertexReqDump({ q, servingConfig: this.servingConfig, request: baseRequest, label: 'retry_base' });
            // autoPaginate: false で手動ページング
            const [r2, , resp2] = await this.client.search(baseRequest, { autoPaginate: false });
            results = r2 as unknown as DiscoverySearchResultItem[];
            response = resp2 as unknown as DiscoverySearchResponse | undefined;

            logVertexResShape({ q, response, results, label: 'retry_base' });

            if (shouldLogFacets()) {
              console.log(
                '[VertexSearchClient][DEBUG] facetSpecs(retry_base)=',
                JSON.stringify((baseRequest as any).facetSpecs ?? [], null, 2),
              );
              console.log(
                '[VertexSearchClient][DEBUG] facets(retry_base)=',
                JSON.stringify(summarizeFacets(response), null, 2),
              );
            }
          } else {
            throw error;
          }
        }
      }

      const elapsed = Date.now() - startTime;

      // results を Car[] に変換
      const items: Car[] = [];
      let skippedNoDoc = 0;
      let skippedNoStruct = 0;
      let skippedMapping = 0;
      const skippedIds: string[] = [];

      for (const result of results) {
        // result.document.structData を取得
        const document = result.document;
        if (!document) {
          skippedNoDoc++;
          continue;
        }

        // structData は protobuf Struct 型で返される
        // fields プロパティから値を抽出する必要がある
        const structData = extractStructData(document.structData);
        if (!structData) {
          skippedNoStruct++;
          continue;
        }

        const car = mapStructDataToCar(structData);
        if (car) {
          items.push(car);
        } else {
          // 必須フィールド欠損の警告
          const docId =
            typeof structData === 'object' && structData !== null
              ? String((structData as Record<string, unknown>)['id'] ?? 'unknown')
              : 'unknown';
          const missing = getMissingRequiredFields(structData);
          console.warn(`[VertexSearchClient] skipping document ${docId}: missing fields [${missing.join(', ')}]`);
          skippedMapping++;
          if (skippedIds.length < 10) skippedIds.push(docId);
        }
      }

      // [DEBUG_MAPPING] 変換時のスキップ集計
      if (skippedNoDoc > 0 || skippedNoStruct > 0 || skippedMapping > 0) {
        console.log(
          `[VertexSearchClient][DEBUG_MAPPING] q="${q}" resultsRaw=${results.length} skippedNoDoc=${skippedNoDoc} skippedNoStruct=${skippedNoStruct} skippedMapping=${skippedMapping} skippedIds=${skippedIds.join(',')}`,
        );
      }

      // totalCount の取得（response から）
      // totalSize は Long 型で返される可能性がある
      let totalCount: number;
      const rawTotalSize = response?.totalSize as unknown;
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
        // 上位3件の詳細をログ出力（原因確定用）
        const top3Details = results.slice(0, 3).map((result, idx) => {
          const doc = result.document;
          const structData = doc ? extractStructData(doc.structData) : null;
          const data = structData as Record<string, unknown> | null;
          return {
            index: idx,
            documentName: doc?.name ?? '(no name)',
            id: data?.id ?? '(no id)',
            maker: data?.maker ?? '(no maker)',
            model: data?.model ?? '(no model)',
            title: data?.title ?? '(no title)',
            modelScores: result.modelScores ?? '(no scores)',
          };
        });

        console.log('[VertexSearchClient] search response:', {
          servingConfig: this.servingConfig,
          totalSize: totalCount,
          resultsCount: results.length,
          itemsCount: items.length,
          elapsedMs: elapsed,
          top3Details,
        });
      }

      // [DEBUG_ITEMS] SSR 突合用の返却直前ログ
      console.log(
        `[VertexSearchClient][DEBUG_ITEMS] q="${q}" resultsRaw=${results.length} itemsMapped=${items.length} ids=${items.slice(0, 10).map((c) => c.id).join(',')}`,
      );

      // facets の抽出
      const facets = extractFacets(response);
      if (shouldLogDebug()) {
        console.log(`[VertexSearchClient][FACETS] q="${q}" facetsCount=${facets.length} keys=${facets.map(f => f.key).join(',')}`);
      }

      return {
        items,
        totalCount,
        facets,
        lastUpdatedAt: computeLastUpdatedAtIso(items),
      };
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in (error as any) ? String((error as any).message) : String(error);
      const stackRaw =
        error && typeof error === 'object' && 'stack' in (error as any) ? String((error as any).stack) : '';
      const stackShort = stackRaw
        ? stackRaw
            .split('\n')
            .slice(0, 6)
            .map((s) => s.trim())
            .join(' | ')
        : '';
      console.error(
        `[VERTEX_ERR] q="${q}" message="${message.replace(/\s+/g, ' ').slice(0, 500)}" stack="${stackShort.slice(0, 1500)}"`,
      );
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

/**
 * Discovery Engine の SearchResponse から Facet[] を抽出
 */
function extractFacets(response: DiscoverySearchResponse | undefined): Facet[] {
  if (!response) return [];

  const rawFacets = response.facets;
  if (!Array.isArray(rawFacets) || rawFacets.length === 0) {
    return [];
  }

  const result: Facet[] = [];

  for (const rawFacet of rawFacets) {
    // key の取得（バージョン差異に備えて複数候補）
    const key = (rawFacet as any)?.key ?? (rawFacet as any)?.facetKey?.key;
    if (typeof key !== 'string' || !key) continue;

    const rawValues = (rawFacet as any)?.values;
    if (!Array.isArray(rawValues)) continue;

    const values: FacetValue[] = [];
    for (const rv of rawValues) {
      const value = rv?.value;
      if (typeof value !== 'string' || !value) continue;

      // count は Long 型の可能性
      let count: number | undefined;
      const rawCount = rv?.count;
      if (typeof rawCount === 'number') {
        count = rawCount;
      } else if (rawCount && typeof (rawCount as any).toNumber === 'function') {
        count = (rawCount as any).toNumber();
      }

      values.push({ value, count });
    }

    if (values.length > 0) {
      result.push({ key, values });
    }
  }

  return result;
}
