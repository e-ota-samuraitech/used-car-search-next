/**
 * SEOライブラリ - ヒステリシス制御
 * 検索結果数の変動によるindex/noindexの頻繁な切り替えを防ぐ
 */

import type { HysteresisResult, IndexState, Pathname } from './types';

// ============================================
// ヒステリシス制御ロジック
// ============================================

/**
 * ヒステリシス制御による index/noindex 判定
 *
 * 仕様書 Ver.1.1準拠:
 * - totalCount < INDEX_OFF_THRESHOLD → 強制 noindex
 * - totalCount >= INDEX_ON_THRESHOLD → index可能状態
 * - 中間値（INDEX_OFF <= totalCount < INDEX_ON）→ 前回状態を維持
 * - 初回（前回状態なし）:
 *   - totalCount >= INDEX_ON_THRESHOLD → index
 *   - それ以外 → noindex
 *
 * @param totalCount 検索結果件数
 * @param indexOnThreshold index ON しきい値（上限）
 * @param indexOffThreshold index OFF しきい値（下限）
 * @param previousState 前回の状態（初回はnull）
 * @returns ヒステリシス判定結果
 */
export function evaluateHysteresis(
  totalCount: number,
  indexOnThreshold: number,
  indexOffThreshold: number,
  previousState: IndexState | null
): HysteresisResult {
  // 1. 下限未満 → 強制 noindex
  if (totalCount < indexOffThreshold) {
    return {
      state: 'noindex',
      previousState,
      reason: `totalCount (${totalCount}) < INDEX_OFF_THRESHOLD (${indexOffThreshold}) - 強制noindex`,
      thresholdMet: false,
    };
  }

  // 2. 上限以上 → index可能状態
  if (totalCount >= indexOnThreshold) {
    return {
      state: 'index',
      previousState,
      reason: `totalCount (${totalCount}) >= INDEX_ON_THRESHOLD (${indexOnThreshold}) - index可能`,
      thresholdMet: true,
    };
  }

  // 3. 中間値（INDEX_OFF <= totalCount < INDEX_ON）→ 前回状態を維持
  if (previousState !== null) {
    return {
      state: previousState,
      previousState,
      reason: `中間値 (${indexOffThreshold} <= ${totalCount} < ${indexOnThreshold}) - 前回状態(${previousState})を維持`,
      thresholdMet: false,
    };
  }

  // 4. 初回（前回状態なし）→ 単純判定
  // totalCount >= INDEX_ON_THRESHOLD なら index、そうでなければ noindex
  // ここに到達するのは indexOffThreshold <= totalCount < indexOnThreshold の初回のみ
  // 仕様上は「INDEX_ON_THRESHOLD未満の初回」は noindex とする
  return {
    state: 'noindex',
    previousState: null,
    reason: `初回判定: totalCount (${totalCount}) < INDEX_ON_THRESHOLD (${indexOnThreshold}) - noindex`,
    thresholdMet: false,
  };
}

/**
 * 検索結果数ガード（最優先ルール）
 *
 * totalCount < MIN_INDEX_COUNT の場合、必ず noindex
 *
 * @param totalCount 検索結果件数
 * @param minIndexCount 最小index件数（MIN_INDEX_COUNT）
 * @returns noindexにすべきか
 */
export function shouldNoindexByCount(totalCount: number, minIndexCount: number): boolean {
  return totalCount < minIndexCount;
}

/**
 * ヒステリシス判定結果をRobotsディレクティブに変換
 */
export function hysteresisToRobots(result: HysteresisResult): 'index,follow' | 'noindex,follow' {
  return result.state === 'index' ? 'index,follow' : 'noindex,follow';
}

// ============================================
// 前回状態の管理ヘルパー
// ============================================

/**
 * 正規URLパスから前回状態のキーを生成
 */
export function generateStateKey(canonicalPath: Pathname): string {
  // 正規URLパスをそのままキーとして使用
  // 例: /cars/p-kanagawa/c-yokohama/
  return canonicalPath;
}

/**
 * ヒステリシス判定とDBホワイトリストを組み合わせた最終判定
 *
 * 優先順位:
 * 1. 検索結果数ガード（最優先）
 * 2. ヒステリシス制御
 * 3. DBホワイトリスト
 * 4. 構造ホワイトリスト
 *
 * @param totalCount 検索結果件数
 * @param minIndexCount 最小index件数
 * @param indexOnThreshold index ON しきい値
 * @param indexOffThreshold index OFF しきい値
 * @param previousState 前回の状態
 * @param isDbWhitelisted DBホワイトリスト登録有無
 * @param isStructuralWhitelisted 構造ホワイトリスト該当有無
 * @returns 最終的なindex状態
 */
export function evaluateFinalIndexState(params: {
  totalCount: number;
  minIndexCount: number;
  indexOnThreshold: number;
  indexOffThreshold: number;
  previousState: IndexState | null;
  isDbWhitelisted: boolean;
  isStructuralWhitelisted: boolean;
}): {
  state: IndexState;
  reason: string;
} {
  const {
    totalCount,
    minIndexCount,
    indexOnThreshold,
    indexOffThreshold,
    previousState,
    isDbWhitelisted,
    isStructuralWhitelisted,
  } = params;

  // 1. 検索結果数ガード（最優先）
  if (shouldNoindexByCount(totalCount, minIndexCount)) {
    return {
      state: 'noindex',
      reason: `検索結果数ガード: totalCount (${totalCount}) < MIN_INDEX_COUNT (${minIndexCount})`,
    };
  }

  // 2. ヒステリシス制御
  const hysteresisResult = evaluateHysteresis(
    totalCount,
    indexOnThreshold,
    indexOffThreshold,
    previousState
  );

  // ヒステリシスで noindex の場合
  if (hysteresisResult.state === 'noindex') {
    return {
      state: 'noindex',
      reason: `ヒステリシス制御: ${hysteresisResult.reason}`,
    };
  }

  // ヒステリシスで index の場合
  // さらにDBホワイトリストまたは構造ホワイトリストを確認

  // 3. DBホワイトリスト登録ありの場合は index
  if (isDbWhitelisted) {
    return {
      state: 'index',
      reason: `DBホワイトリスト登録あり + ヒステリシスindex可能`,
    };
  }

  // 4. 構造ホワイトリスト該当の場合は index候補
  if (isStructuralWhitelisted) {
    return {
      state: 'index',
      reason: `構造ホワイトリスト該当 + ヒステリシスindex可能`,
    };
  }

  // どのホワイトリストにも該当しない場合は noindex
  return {
    state: 'noindex',
    reason: `ホワイトリスト未登録（DBホワイトリスト: ${isDbWhitelisted}, 構造: ${isStructuralWhitelisted}）`,
  };
}
