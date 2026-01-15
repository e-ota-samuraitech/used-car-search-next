/**
 * SEOライブラリ - インメモリストア実装
 * 開発・テスト用の仮実装（本番ではCloud SQLなどに差し替え）
 */

import type { IndexState, Pathname } from '../types';
import type { SeoStateStore, SeoAllowlistStore, SeoStoreRegistry } from '../stores';

// ============================================
// インメモリ状態ストア
// ============================================

/**
 * ヒステリシス状態をメモリに保存する実装
 * 注意: サーバー再起動で状態が失われます。本番環境では永続化ストアに差し替えてください。
 */
export class InMemorySeoStateStore implements SeoStateStore {
  private states: Map<string, IndexState> = new Map();

  async getLastState(key: string): Promise<IndexState | null> {
    return this.states.get(key) ?? null;
  }

  async setLastState(key: string, state: IndexState): Promise<void> {
    this.states.set(key, state);
  }

  async clearState(key: string): Promise<void> {
    this.states.delete(key);
  }

  async clearAllStates(): Promise<void> {
    this.states.clear();
  }

  /**
   * 現在保存されている全ての状態を取得（デバッグ用）
   */
  getAllStates(): Map<string, IndexState> {
    return new Map(this.states);
  }
}

// ============================================
// インメモリホワイトリストストア
// ============================================

/**
 * DBホワイトリストをメモリに保存する実装
 * 注意: サーバー再起動でデータが失われます。本番環境では永続化ストアに差し替えてください。
 */
export class InMemorySeoAllowlistStore implements SeoAllowlistStore {
  private whitelist: Set<string> = new Set();

  constructor(initialPaths?: Pathname[]) {
    if (initialPaths) {
      initialPaths.forEach(path => this.whitelist.add(path));
    }
  }

  async isDbWhitelisted(path: Pathname): Promise<boolean> {
    return this.whitelist.has(path);
  }

  async addToWhitelist(path: Pathname): Promise<void> {
    this.whitelist.add(path);
  }

  async removeFromWhitelist(path: Pathname): Promise<void> {
    this.whitelist.delete(path);
  }

  async getAllWhitelistedPaths(): Promise<Pathname[]> {
    return Array.from(this.whitelist) as Pathname[];
  }

  /**
   * ホワイトリストをクリア（テスト用）
   */
  async clearWhitelist(): Promise<void> {
    this.whitelist.clear();
  }
}

// ============================================
// デフォルトストアレジストリ
// ============================================

/**
 * インメモリ実装を使用したストアレジストリを生成
 *
 * @param options オプション設定
 * @returns ストアレジストリ
 */
export function createInMemoryStoreRegistry(options?: {
  initialWhitelistedPaths?: Pathname[];
}): SeoStoreRegistry {
  return {
    stateStore: new InMemorySeoStateStore(),
    allowlistStore: new InMemorySeoAllowlistStore(options?.initialWhitelistedPaths),
  };
}

/**
 * シングルトンインスタンス（簡易実装用）
 * 本番環境では使用せず、リクエストごとに適切なストアを注入してください
 */
let defaultRegistry: SeoStoreRegistry | null = null;

/**
 * デフォルトのストアレジストリを取得（シングルトン）
 */
export function getDefaultStoreRegistry(): SeoStoreRegistry {
  if (!defaultRegistry) {
    // 初期ホワイトリストの例（本番環境ではDBから取得）
    const initialWhitelistedPaths: Pathname[] = [
      '/cars/',
      '/cars/p-tokyo/',
      '/cars/p-kanagawa/',
      '/cars/p-kanagawa/c-yokohama/',
      '/cars/p-osaka/',
      '/cars/m-toyota/',
      '/cars/m-honda/',
      '/cars/m-nissan/',
      '/cars/f-4wd/',
      '/cars/f-hybrid/',
    ];

    defaultRegistry = createInMemoryStoreRegistry({
      initialWhitelistedPaths,
    });
  }

  return defaultRegistry;
}

/**
 * デフォルトのストアレジストリをリセット（テスト用）
 */
export function resetDefaultStoreRegistry(): void {
  defaultRegistry = null;
}
