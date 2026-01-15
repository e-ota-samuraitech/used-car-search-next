/**
 * SEOライブラリ - メインAPI
 * 中古車検索サイト SEO仕様書 Ver.1.1 準拠
 */

import type { SeoRequestContext, SeoResult, RobotsMetaContent, AbsoluteUrl, SeoReasonCode } from './types';
import type { SeoStoreRegistry } from './stores';
import { getBaseUrl, isValidBaseUrl, inferScope, getMinIndexCount, getIndexOnThreshold, getIndexOffThreshold, isFeatureWhitelisted } from './config';
import { parseUrl, buildCanonicalPath, buildAbsoluteUrl, isStructuralWhitelisted, isCanonicalUrlType, hasNonCanonicalParams, normalizeQueryValue } from './url';
import { evaluateQueryUpgrade } from './keyword';
import { evaluateFinalIndexState, generateStateKey } from './hysteresis';
import { generateSeoTexts, applySeoTextsOverride } from './templates';
import { getDefaultStoreRegistry } from './stores/inMemory';

// ============================================
// メインSEO評価API
// ============================================

/**
 * SEO評価のオプション設定
 */
export interface EvaluateSeoOptions {
  /** ストアレジストリ（省略時はデフォルトのインメモリ実装） */
  stores?: SeoStoreRegistry;

  /** カスタムテキスト（オーバーライド用） */
  customTexts?: {
    title?: string;
    h1?: string;
    description?: string;
  };

  /** 車両詳細データ（detail pageの場合） */
  carData?: {
    maker: string;
    model: string;
    grade: string;
    price: number;
  };

  /** デバッグモード（詳細なログ出力） */
  debug?: boolean;
}

/**
 * SEO評価メイン関数
 *
 * 仕様書Ver.1.1の優先順位に従って評価:
 * 1. クエリ検索の昇格（301）
 * 2. 検索結果数ガード（最優先）
 * 3. ヒステリシス制御
 * 4. DBホワイトリスト登録有無
 * 5. 構造ホワイトリスト判定
 * 6. URL種別ルール（クエリ・feature・正規パス）
 * 7. canonical決定
 *
 * @param context リクエストコンテキスト
 * @param options オプション設定
 * @returns SEO評価結果
 */
export async function evaluateSeo(
  context: SeoRequestContext,
  options?: EvaluateSeoOptions
): Promise<SeoResult> {
  const { pathname, query, totalCount, baseUrl } = context;
  const stores = options?.stores ?? getDefaultStoreRegistry();
  const debug = options?.debug ?? false;

  const trace: SeoReasonCode[] = [];

  const finalize = (
    partial: Omit<SeoResult, 'reasonPrimary' | 'reasonTrace'>,
    reasonPrimary: SeoReasonCode,
    reasonTrace: SeoReasonCode[]
  ): SeoResult => {
    const decision: SeoReasonCode = partial.robots === 'index,follow' ? 'DECISION_INDEX' : 'DECISION_NOINDEX';
    const traceWithDecision = reasonTrace[reasonTrace.length - 1] === decision
      ? reasonTrace
      : [...reasonTrace, decision];

    return {
      ...partial,
      reasonPrimary,
      reasonTrace: traceWithDecision,
    };
  };

  // デバッグログ用
  const debugMessages: string[] = [];
  const log = (msg: string) => {
    if (debug) {
      debugMessages.push(msg);
      console.log(`[SEO Debug] ${msg}`);
    }
  };

  log(`=== SEO Evaluation Start ===`);
  log(`Pathname: ${pathname}`);
  log(`TotalCount: ${totalCount}`);

  // ベースURLの検証
  if (!isValidBaseUrl(baseUrl)) {
    throw new Error(`Invalid baseUrl: ${baseUrl}. Must start with http:// or https://`);
  }

  // ============================================
  // 1. クエリ検索の昇格判定（301）
  // ============================================

  const queryUpgrade = evaluateQueryUpgrade(query);
  if (queryUpgrade.canUpgrade && queryUpgrade.upgradePath) {
    log(`Query upgrade: ${queryUpgrade.matchType} -> ${queryUpgrade.upgradePath}`);

    trace.push('UPGRADE_REDIRECT');

    const upgradeAbsoluteUrl = buildAbsoluteUrl(baseUrl, queryUpgrade.upgradePath);
    const parsed = parseUrl(queryUpgrade.upgradePath, query);
    const texts = generateSeoTexts(parsed, options?.carData);

    return finalize(
      {
      robots: 'noindex,follow', // 301する前のページはnoindex
      canonicalUrl: upgradeAbsoluteUrl,
      redirectUrl: upgradeAbsoluteUrl,
      title: texts.title,
      h1: texts.h1,
      description: texts.description,
      debugReason: `Query upgrade to ${queryUpgrade.upgradePath} (${queryUpgrade.matchType})`,
      urlType: parsed.type,
      parsedUrl: parsed,
      },
      'UPGRADE_REDIRECT',
      trace
    );
  }

  // ============================================
  // 2. URLをパース
  // ============================================

  const parsed = parseUrl(pathname, query);
  log(`URL Type: ${parsed.type}`);

  // 正規パスを生成
  const canonicalPath = buildCanonicalPath(parsed);
  const canonicalUrl = buildAbsoluteUrl(baseUrl, canonicalPath);
  log(`Canonical Path: ${canonicalPath}`);

  // ============================================
  // 3. 検索結果数ガード（最優先）
  // ============================================

  const scope = inferScope(parsed.type, {
    pref: !!parsed.prefSlug,
    city: !!parsed.citySlug,
    feature: !!parsed.featureSlug,
    maker: !!parsed.makerSlug,
    model: !!parsed.modelSlug,
  });
  log(`Scope: ${scope}`);

  const minIndexCount = getMinIndexCount(scope);
  log(`MIN_INDEX_COUNT: ${minIndexCount}`);

  if (totalCount < minIndexCount) {
    log(`Search result guard: totalCount (${totalCount}) < MIN_INDEX_COUNT (${minIndexCount}) -> noindex`);

    trace.push('COUNT_GUARD_BLOCK');

    const texts = applySeoTextsOverride(
      generateSeoTexts(parsed, options?.carData),
      options?.customTexts
    );

    return finalize(
      {
      robots: 'noindex,follow',
      canonicalUrl,
      title: texts.title,
      h1: texts.h1,
      description: texts.description,
      debugReason: `Search result guard: totalCount (${totalCount}) < MIN_INDEX_COUNT (${minIndexCount})`,
      urlType: parsed.type,
      parsedUrl: parsed,
      },
      'COUNT_GUARD_BLOCK',
      trace
    );
  }

  trace.push('COUNT_GUARD_PASS');

  // ============================================
  // 4. ページネーションやソートパラメータのチェック
  // ============================================

  if (hasNonCanonicalParams(parsed)) {
    log(`Non-canonical params detected (page >= 2) -> noindex`);

    trace.push('SORT_OR_PAGINATION_NOINDEX');

    const texts = applySeoTextsOverride(
      generateSeoTexts(parsed, options?.carData),
      options?.customTexts
    );

    return finalize(
      {
      robots: 'noindex,follow',
      canonicalUrl,
      title: texts.title,
      h1: texts.h1,
      description: texts.description,
      debugReason: `Non-canonical params (page=${parsed.page})`,
      urlType: parsed.type,
      parsedUrl: parsed,
      },
      'SORT_OR_PAGINATION_NOINDEX',
      trace
    );
  }

  // ============================================
  // 5. URL種別による基本判定
  // ============================================

  // クエリ検索（昇格できなかったもの）→ noindex
  if (parsed.type === 'query-search' || parsed.type === 'unknown') {
    log(`Query search or unknown type -> noindex`);

    trace.push('QUERY_NOINDEX');

    const texts = applySeoTextsOverride(
      generateSeoTexts(parsed, options?.carData),
      options?.customTexts
    );

    return finalize(
      {
      robots: 'noindex,follow',
      canonicalUrl,
      title: texts.title,
      h1: texts.h1,
      description: texts.description,
      debugReason: `Query search or unknown URL type`,
      urlType: parsed.type,
      parsedUrl: parsed,
      },
      'QUERY_NOINDEX',
      trace
    );
  }

  // フリーワード検索 → noindex（但し表示はする）
  if (parsed.type === 'freeword') {
    log(`Freeword search -> noindex`);

    trace.push('QUERY_NOINDEX');

    const texts = applySeoTextsOverride(
      generateSeoTexts(parsed, options?.carData),
      options?.customTexts
    );

    return finalize(
      {
      robots: 'noindex,follow',
      canonicalUrl,
      title: texts.title,
      h1: texts.h1,
      description: texts.description,
      debugReason: `Freeword search`,
      urlType: parsed.type,
      parsedUrl: parsed,
      },
      'QUERY_NOINDEX',
      trace
    );
  }

  // 車両詳細ページ → 常にindex（ただし件数ガードは通過済み）
  if (parsed.type === 'detail') {
    log(`Detail page -> index`);

    const texts = applySeoTextsOverride(
      generateSeoTexts(parsed, options?.carData),
      options?.customTexts
    );

    return finalize(
      {
      robots: 'index,follow',
      canonicalUrl,
      title: texts.title,
      h1: texts.h1,
      description: texts.description,
      debugReason: `Detail page`,
      urlType: parsed.type,
      parsedUrl: parsed,
      },
      'DECISION_INDEX',
      trace
    );
  }

  // featureページのホワイトリストチェック
  if (parsed.type === 'feature' || parsed.type === 'pref-feature') {
    if (parsed.featureSlug && !isFeatureWhitelisted(parsed.featureSlug)) {
      log(`Feature not whitelisted: ${parsed.featureSlug} -> noindex`);

      trace.push('FEATURE_NOT_WHITELISTED');

      const texts = applySeoTextsOverride(
        generateSeoTexts(parsed, options?.carData),
        options?.customTexts
      );

      return finalize(
        {
        robots: 'noindex,follow',
        canonicalUrl,
        title: texts.title,
        h1: texts.h1,
        description: texts.description,
        debugReason: `Feature not in whitelist: ${parsed.featureSlug}`,
        urlType: parsed.type,
        parsedUrl: parsed,
        },
        'FEATURE_NOT_WHITELISTED',
        trace
      );
    }
  }

  // ============================================
  // 6. 正規URL（短URL）の場合 → ヒステリシス+ホワイトリスト判定
  // ============================================

  if (isCanonicalUrlType(parsed.type)) {
    log(`Canonical URL type -> Evaluating hysteresis + whitelist`);

    // ヒステリシス用のしきい値取得
    const indexOnThreshold = getIndexOnThreshold(scope);
    const indexOffThreshold = getIndexOffThreshold(scope);
    log(`Hysteresis thresholds: ON=${indexOnThreshold}, OFF=${indexOffThreshold}`);

    // 前回状態を取得
    const stateKey = generateStateKey(canonicalPath);
    const previousState = await stores.stateStore.getLastState(stateKey);
    log(`Previous state: ${previousState ?? 'none'}`);

    // DBホワイトリスト判定
    const isDbWhitelisted = await stores.allowlistStore.isDbWhitelisted(canonicalPath);
    log(`DB Whitelisted: ${isDbWhitelisted}`);

    // 構造ホワイトリスト判定
    const isStructuralWhitelistedFlag = isStructuralWhitelisted(parsed);
    log(`Structural Whitelisted: ${isStructuralWhitelistedFlag}`);

    // Hysteresis trace (do not alter decision)
    const hysteresisCode: SeoReasonCode =
      totalCount < indexOffThreshold
        ? 'HYSTERESIS_INDEX_OFF'
        : totalCount >= indexOnThreshold
          ? 'HYSTERESIS_INDEX_ON'
          : 'HYSTERESIS_HOLD_PREVIOUS';
    trace.push(hysteresisCode);

    trace.push(isDbWhitelisted ? 'DB_ALLOW' : 'DB_DENY');
    trace.push(isStructuralWhitelistedFlag ? 'STRUCT_ALLOW' : 'STRUCT_DENY');

    // 最終的なindex状態を評価
    const finalState = evaluateFinalIndexState({
      totalCount,
      minIndexCount,
      indexOnThreshold,
      indexOffThreshold,
      previousState,
      isDbWhitelisted,
      isStructuralWhitelisted: isStructuralWhitelistedFlag,
    });

    log(`Final state: ${finalState.state} - ${finalState.reason}`);

    // 状態を保存
    await stores.stateStore.setLastState(stateKey, finalState.state);

    const robots: RobotsMetaContent = finalState.state === 'index' ? 'index,follow' : 'noindex,follow';
    const texts = applySeoTextsOverride(
      generateSeoTexts(parsed, options?.carData),
      options?.customTexts
    );

    const primary: SeoReasonCode =
      robots === 'index,follow'
        ? (isDbWhitelisted ? 'DB_ALLOW' : 'STRUCT_ALLOW')
        : (hysteresisCode === 'HYSTERESIS_INDEX_ON' ? 'STRUCT_DENY' : hysteresisCode);

    return finalize(
      {
        robots,
        canonicalUrl,
        title: texts.title,
        h1: texts.h1,
        description: texts.description,
        debugReason: finalState.reason + (debugMessages.length > 0 ? `\n${debugMessages.join('\n')}` : ''),
        urlType: parsed.type,
        parsedUrl: parsed,
      },
      primary,
      trace
    );
  }

  // ============================================
  // 7. その他 → デフォルトnoindex
  // ============================================

  log(`Default fallback -> noindex`);

  trace.push('QUERY_NOINDEX');

  const texts = applySeoTextsOverride(
    generateSeoTexts(parsed, options?.carData),
    options?.customTexts
  );

  return finalize(
    {
    robots: 'noindex,follow',
    canonicalUrl,
    title: texts.title,
    h1: texts.h1,
    description: texts.description,
    debugReason: `Default fallback for type: ${parsed.type}`,
    urlType: parsed.type,
    parsedUrl: parsed,
    },
    'QUERY_NOINDEX',
    trace
  );
}

// ============================================
// 便利関数
// ============================================

/**
 * クエリパラメータからキーワードを抽出
 */
export function extractKeyword(query: Record<string, string | string[] | undefined>): string | null {
  const q = normalizeQueryValue(query.q || query.keyword);
  return q || null;
}

/**
 * 型定義とユーティリティの再エクスポート
 */
export * from './types';
export * from './config';
export * from './url';
export * from './keyword';
export * from './hysteresis';
export * from './templates';
export * from './stores';
export * from './stores/inMemory';
export * from './buildFilterUrl';
export * from './buildSearchUrl';
