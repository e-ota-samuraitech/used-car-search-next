import type { GetServerSideProps } from 'next';
import { encodeShopSlug } from '@/lib/shops/slug';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const raw = typeof context.params?.shopName === 'string' ? context.params.shopName : '';
  const decodedShopName = raw ? decodeURIComponent(raw).trim() : '';

  if (!decodedShopName) {
    return { notFound: true };
  }

  const shopSlug = encodeShopSlug(decodedShopName);
  if (!shopSlug) {
    return { notFound: true };
  }

  return {
    redirect: {
      destination: `/shops/${shopSlug}/`,
      permanent: true,
    },
  };
};

export default function LegacyShopPage() {
  return null;
}
