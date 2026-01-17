import type { GetServerSideProps } from 'next';

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

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const siteUrl = getSiteUrlFromEnvOrReq(req);

  const body = [
    'User-agent: *',
    'Disallow: /api/',
    'Disallow: /_next/',
    'Disallow: /results/',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);

  return { props: {} };
};

export default function RobotsTxtPage(): null {
  return null;
}
