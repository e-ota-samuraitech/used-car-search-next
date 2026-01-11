import Layout from '@/components/common/Layout';
import SearchBar from '@/components/results/SearchBar';
import SearchLogo from '@/components/common/SearchLogo';

export default function TopPage() {
  return (
    <Layout showFilters={false}>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[680px] px-4 py-8">
          <SearchLogo />
          <SearchBar variant="large" />
        </div>
      </main>
    </Layout>
  );
}
