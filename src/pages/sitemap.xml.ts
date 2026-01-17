import type { GetServerSideProps } from 'next';

import type { Pathname } from '@/lib/seo';
import { getDefaultStoreRegistry } from '@/lib/seo';

function normalizeSiteUrl(raw: string): string {
  const trimmed = raw.trim();
  const withoutTrailingSlash = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  return withoutTrailingSlash;
}

function getSiteUrlFromEnvOrReq(req: { headers: { host?: string } }): string {
  const envSiteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? '');
  if (envSiteUrl.startsWith('http://') || envSiteUrl.startsWith('https://')) return envSiteUrl;

  const envBaseUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_BASE_URL ?? '');
  if (envBaseUrl.startsWith('http://') || envBaseUrl.startsWith('https://')) return envBaseUrl;

  const host = (req.headers.host ?? 'localhost:3000').trim();
  return `http://${host}`;
}

function normalizePathForSitemap(path: string): string {
  let p = path.trim();
  if (!p.startsWith('/')) p = `/${p}`;

  // If the path ends with an extension, keep as-is (avoid turning index.html into index.html/)
  const hasExtension = /\.[a-z0-9]+$/i.test(p);
  if (!hasExtension && !p.endsWith('/')) p = `${p}/`;

  return p;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderSitemapXml(urls: string[]): string {
  const items = urls
    .map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`)
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    items,
    '</urlset>',
    '',
  ].join('\n');
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const siteUrl = getSiteUrlFromEnvOrReq(req);

  const registry = getDefaultStoreRegistry();
  const allowlistPaths: Pathname[] = registry.allowlistStore.getAllWhitelistedPaths
    ? await registry.allowlistStore.getAllWhitelistedPaths()
    : [];

  const normalizedPaths = new Set<string>();
  normalizedPaths.add('/cars/');

  for (const p of allowlistPaths) {
    normalizedPaths.add(normalizePathForSitemap(String(p)));
  }

  const urls = Array.from(normalizedPaths)
    .map((p) => `${siteUrl}${p}`)
    .sort();

  const xml = renderSitemapXml(urls);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(xml);

  return { props: {} };
};

export default function SitemapXmlPage(): null {
  return null;
}
