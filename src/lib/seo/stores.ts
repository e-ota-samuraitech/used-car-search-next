/**
 * SEOライブラリ - 抽象ストアインターフェイス
 * DBホワイトリスト、ヒステリシス状態保存などの抽象化
 */

import type { IndexState, Pathname } from './types';

// ============================================
// ヒステリシス状態ストア
// ============================================

/**
 * ヒステリシス状態ストアのインターフェイス
 *
 * 前回のindex/noindex状態を保存・取得する
 * 実装はCloud SQL、Redis、メモリなど様々な方法が可能
 */
export interface SeoStateStore {
  /**
   * 前回の状態を取得
   * @param key 正規URLパス（例: /cars/p-kanagawa/c-yokohama/）
   * @returns 前回の状態（初回はnull）
   */
  getLastState(key: string): Promise<IndexState | null>;

  /**
   * 現在の状態を保存
   * @param key 正規URLパス
   * @param state 現在の状態
   */
  setLastState(key: string, state: IndexState): Promise<void>;

  /**
   * 状態をクリア（テスト用）
   * @param key 正規URLパス
   */
  clearState?(key: string): Promise<void>;

  /**
   * 全ての状態をクリア（テスト用）
   */
  clearAllStates?(): Promise<void>;
}

// ============================================
// DBホワイトリストストア
// ============================================

/**
 * DBホワイトリストストアのインターフェイス
 *
 * index化を希望する正規URL（短URL）をDB登録・照会する
 * 実装はCloud SQL、外部APIなど様々な方法が可能
 */
export interface SeoAllowlistStore {
  /**
   * 指定されたパスがDBホワイトリストに登録されているかチェック
   * @param path 正規URLパス（例: /cars/p-kanagawa/c-yokohama/）
   * @returns DBホワイトリスト登録済みの場合true
   */
  isDbWhitelisted(path: Pathname): Promise<boolean>;

  /**
   * パスをDBホワイトリストに追加
   * @param path 正規URLパス
   */
  addToWhitelist?(path: Pathname): Promise<void>;

  /**
   * パスをDBホワイトリストから削除
   * @param path 正規URLパス
   */
  removeFromWhitelist?(path: Pathname): Promise<void>;

  /**
   * 全てのホワイトリスト登録パスを取得
   * @returns ホワイトリスト登録済みのパス一覧
   */
  getAllWhitelistedPaths?(): Promise<Pathname[]>;
}

// ============================================
// 複合ストア（将来の拡張用）
// ============================================

/**
 * SEO関連の全ストアを統合したインターフェイス
 */
export interface SeoStoreRegistry {
  /** ヒステリシス状態ストア */
  stateStore: SeoStateStore;

  /** DBホワイトリストストア */
  allowlistStore: SeoAllowlistStore;
}

/**
 * デフォルトのストアレジストリ生成関数の型
 */
export type CreateSeoStoreRegistry = () => SeoStoreRegistry;
