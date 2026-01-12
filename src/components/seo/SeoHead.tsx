import Head from 'next/head';

export interface SeoHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
}

export const SeoHead = ({ title, description, canonicalUrl, robots }: SeoHeadProps) => {
  return (
    <Head>
      {title ? <title>{title}</title> : null}
      {description ? <meta name="description" content={description} /> : null}
      {robots ? <meta name="robots" content={robots} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
    </Head>
  );
};
