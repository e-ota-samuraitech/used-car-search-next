import type { GetServerSideProps } from 'next';

interface LegacyCarDetailRedirectProps {
  id: string;
}

export const getServerSideProps: GetServerSideProps<LegacyCarDetailRedirectProps> = async (context) => {
  const id = context.params?.id;
  if (typeof id !== 'string' || !id) {
    return { notFound: true };
  }

  return {
    redirect: {
      destination: `/cars/d-${id}/`,
      permanent: true,
    },
  };
};

export default function DetailPage() {
  return null;
}
