/**
 * SEOライブラリ - Cloud SQL ストア実装
 * PostgreSQL (Cloud SQL) からホワイトリストを取得
 *
 * 注意: pg モジュールはサーバーサイド専用のため、eval を使って動的にロードする
 */

import type { Pathname } from '../types';
import type { SeoAllowlistStore } from '../stores';

/** キャッシュTTL（ミリ秒） */
const CACHE_TTL_MS = 60 * 1000; // 60秒

/** キャッシュ状態 */
interface CacheState {
  /** キャッシュされたパスのSet */
  paths: Set<string>;
  /** キャッシュ更新時刻 */
  updatedAt: number;
}

/** Pool インスタンス（型は any だが、pg.Pool として使用） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any = null;

/**
 * 接続設定を構築
 */
function buildPoolConfig(): Record<string, unknown> | null {
  // 1. DATABASE_URL 優先（ローカル開発用）
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 5,
    };
  }

  // 2. Cloud SQL unix socket 接続
  const connectionName = process.env.CLOUDSQL_CONNECTION_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASS;
  const database = process.env.DB_NAME;

  if (!connectionName || !user || !password || !database) {
    return null;
  }

  return {
    host: `/cloudsql/${connectionName}`,
    user,
    password,
    database,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 5,
  };
}

/**
 * pg モジュールを動的にロード
 * webpack の静的解析を回避するため、eval を使用
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadPgModule(): any {
  try {
    // webpack の静的解析を回避
    // eslint-disable-next-line no-eval
    return eval("require('pg')");
  } catch {
    return null;
  }
}

/**
 * Pool を取得（遅延初期化・動的ロード）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPool(): any {
  if (pool) {
    return pool;
  }

  const config = buildPoolConfig();
  if (!config) {
    console.warn(
      '[CloudSqlSeoAllowlistStore] DB接続設定が不足しています。' +
        'DATABASE_URL または CLOUDSQL_CONNECTION_NAME + DB_USER/DB_PASS/DB_NAME が必要です。'
    );
    return null;
  }

  try {
    const pg = loadPgModule();
    if (!pg) {
      console.error('[CloudSqlSeoAllowlistStore] pg モジュールのロードに失敗しました');
      return null;
    }

    pool = new pg.Pool(config);

    pool.on('error', (err: Error) => {
      console.error('[CloudSqlSeoAllowlistStore] Pool error:', err.message);
    });

    return pool;
  } catch (err) {
    console.error(
      '[CloudSqlSeoAllowlistStore] Pool初期化に失敗:',
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Cloud SQL からホワイトリストを取得するストア実装
 *
 * - TTL(60秒)でキャッシュを更新
 * - DB失敗時は fail-closed（false返却）+ LKGキャッシュがあればそれを使用
 */
export class CloudSqlSeoAllowlistStore implements SeoAllowlistStore {
  /** 現在のキャッシュ */
  private cache: CacheState | null = null;

  /** Last Known Good キャッシュ（DB失敗時のフォールバック用） */
  private lkgCache: CacheState | null = null;

  /** キャッシュ更新中フラグ（重複リクエスト防止） */
  private refreshing: Promise<void> | null = null;

  /**
   * キャッシュが有効かどうか
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.updatedAt < CACHE_TTL_MS;
  }

  /**
   * DBからホワイトリストを取得してキャッシュを更新
   */
  private async refreshCache(): Promise<void> {
    // 既に更新中なら待機
    if (this.refreshing) {
      await this.refreshing;
      return;
    }

    this.refreshing = this.doRefreshCache();
    try {
      await this.refreshing;
    } finally {
      this.refreshing = null;
    }
  }

  /**
   * 実際のキャッシュ更新処理
   */
  private async doRefreshCache(): Promise<void> {
    const currentPool = getPool();
    if (!currentPool) {
      console.warn('[CloudSqlSeoAllowlistStore] Pool が取得できません。LKG または fail-closed で動作します。');
      return;
    }

    try {
      const result = await currentPool.query(
        'SELECT path FROM seo_allowlist WHERE enabled = true ORDER BY path'
      );

      const paths = new Set<string>();
      for (const row of result.rows as Array<{ path: string }>) {
        paths.add(row.path);
      }

      const newCache: CacheState = {
        paths,
        updatedAt: Date.now(),
      };

      this.cache = newCache;
      this.lkgCache = newCache; // 成功したらLKGも更新

      if (process.env.NODE_ENV === 'development') {
        console.log(`[CloudSqlSeoAllowlistStore] キャッシュ更新完了: ${paths.size}件`);
      }
    } catch (err) {
      console.error('[CloudSqlSeoAllowlistStore] DB取得失敗:', err instanceof Error ? err.message : err);
      // 失敗時はキャッシュを更新しない（LKGを維持）
    }
  }

  /**
   * 現在有効なキャッシュを取得（TTLキャッシュ → LKG → null の順）
   */
  private async getEffectiveCache(): Promise<CacheState | null> {
    // TTLキャッシュが有効ならそのまま使用
    if (this.isCacheValid()) {
      return this.cache;
    }

    // キャッシュ更新を試行
    await this.refreshCache();

    // 更新後のキャッシュがあれば使用
    if (this.cache && this.isCacheValid()) {
      return this.cache;
    }

    // LKGがあればそれを使用（TTL切れでも）
    if (this.lkgCache) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CloudSqlSeoAllowlistStore] LKGキャッシュを使用');
      }
      return this.lkgCache;
    }

    return null;
  }

  /**
   * 指定されたパスがDBホワイトリストに登録されているかチェック
   * DB失敗時は fail-closed（false）、LKGがあればそれで判定
   */
  async isDbWhitelisted(path: Pathname): Promise<boolean> {
    const cache = await this.getEffectiveCache();

    if (!cache) {
      // キャッシュもLKGも無い場合は fail-closed
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[CloudSqlSeoAllowlistStore] isDbWhitelisted: キャッシュ無し、fail-closed (false) path=${path}`);
      }
      return false;
    }

    return cache.paths.has(path);
  }

  /**
   * 全てのホワイトリスト登録パスを取得
   * DB失敗時はLKGがあればそれを返す、無ければ空配列
   */
  async getAllWhitelistedPaths(): Promise<Pathname[]> {
    const cache = await this.getEffectiveCache();

    if (!cache) {
      // キャッシュもLKGも無い場合は空配列
      if (process.env.NODE_ENV === 'development') {
        console.warn('[CloudSqlSeoAllowlistStore] getAllWhitelistedPaths: キャッシュ無し、空配列を返却');
      }
      return [];
    }

    return Array.from(cache.paths) as Pathname[];
  }
}
