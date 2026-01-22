import Layout from '@/components/common/Layout';
import SearchBar from '@/components/results/SearchBar';
import SearchLogo from '@/components/common/SearchLogo';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function TopPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);
    const handleError = () => setIsNavigating(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router.events]);

  return (
    <Layout showFilters={false}>
      <main className="flex-1 flex items-center justify-center" style={{ paddingTop: '10vh' }}>
        <div className="w-full max-w-[680px] px-4 py-8">
          <SearchLogo />
          <SearchBar variant="large" isNavigating={isNavigating} placeholder="" />
        </div>
      </main>
    </Layout>
  );
}
