import type { Pathname, QueryParams, SeoDecision } from './types';
import { buildRobotsContent, normalizeQueryParam } from './types';
import { toCarsCanonicalPathFromQuery, toCarsRedirectPathFromQuery } from './urlConverter';

export interface DecideSearchUiSeoInput {
  pathname: Pathname;
  query: QueryParams;
  // 0件判定やページネーション判定は Step2 以降で接続する想定
  resultCount?: number;
}

function parsePage(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
}

export function decideSeoForCarsSearchUi(input: DecideSearchUiSeoInput): SeoDecision {
  const pageRaw = normalizeQueryParam(input.query.page);
  const page = parsePage(pageRaw) ?? 1;

  const canonicalFromQuery = toCarsCanonicalPathFromQuery(input.query);
  const redirectFromQuery = toCarsRedirectPathFromQuery(input.query);

  // ページ2以降：noindex（canonical は原則 self）
  if (page >= 2) {
    return {
      robots: buildRobotsContent({ noindex: true }),
      canonicalPath: input.pathname,
    };
  }

  // 0件：noindex（canonical は親の回送URLに寄せる。なければ self）
  if (typeof input.resultCount === 'number' && input.resultCount <= 0) {
    return {
      robots: buildRobotsContent({ noindex: true }),
      canonicalPath: canonicalFromQuery ?? input.pathname,
    };
  }

  // 検索UIは原則 noindex,follow + canonical寄せ
  return {
    robots: buildRobotsContent({ noindex: true }),
    canonicalPath: canonicalFromQuery ?? input.pathname,
    ...(redirectFromQuery ? { redirectPath: redirectFromQuery } : {}),
  };
}
