export type AbsoluteUrl = `http://${string}` | `https://${string}`;
export type Pathname = `/${string}`;

export type IndexDirective = 'index' | 'noindex';
export type FollowDirective = 'follow' | 'nofollow';
export type RobotsMetaContent = `${IndexDirective},${FollowDirective}`;

export type QueryParamValue = string | string[] | undefined;
export type QueryParams = Record<string, QueryParamValue>;

// SEO用の正規slug（回送URLで使用）。slugの正はこのファイル。
export const PREF_SLUGS = [
  'tokyo',
  'kanagawa',
  'chiba',
  'saitama',
  'osaka',
  'hyogo',
  'kyoto',
  'aichi',
  'shizuoka',
  'fukuoka',
  'kumamoto',
  'miyagi',
] as const;
export type PrefSlug = (typeof PREF_SLUGS)[number];

export const MAKER_SLUGS = [
  'toyota',
  'honda',
  'nissan',
  'suzuki',
  'mazda',
  'subaru',
  'daihatsu',
  'mitsubishi',
  'lexus',
  'audi',
  'jeep',
  'volkswagen',
  'peugeot',
  'volvo',
  'mercedes-benz',
  'bmw',
  'mini',
] as const;
export type MakerSlug = (typeof MAKER_SLUGS)[number];

export type SeoRouteType = 'carsTop' | 'carsPref' | 'carsMaker' | 'carsPrefMaker' | 'carsDetail' | 'carsSearchUi';

export interface SeoDecision {
  robots: RobotsMetaContent;
  canonicalPath: Pathname | null;
  redirectPath?: Pathname;
}

export function normalizeQueryParam(value: QueryParamValue): string {
  if (value === undefined) return '';
  if (Array.isArray(value)) return value[0] ?? '';
  return value;
}

export function buildRobotsContent(opts: { noindex?: boolean; nofollow?: boolean }): RobotsMetaContent {
  const index: IndexDirective = opts.noindex ? 'noindex' : 'index';
  const follow: FollowDirective = opts.nofollow ? 'nofollow' : 'follow';
  return `${index},${follow}`;
}

export function joinAbsoluteUrl(siteUrl: AbsoluteUrl, path: Pathname): AbsoluteUrl {
  const base = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  const p = path.startsWith('/') ? path : (`/${path}` as Pathname);
  return `${base}${p}` as AbsoluteUrl;
}
