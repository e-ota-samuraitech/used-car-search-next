import { useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import Layout from '@/components/common/Layout';
import SearchBar from '@/components/results/SearchBar';
import ResultsList from '@/components/results/ResultsList';
import { useApp } from '@/context/AppContext';
import type { SortBy } from '@/types';

export default function ResultsPage() {
  const { results, sortBy, setSortBy, runSearch, applySort, setResults } = useApp();

  useEffect(() => {
    if (results.length === 0) {
      runSearch();
    }
  }, []);

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value as SortBy;
    setSortBy(newSortBy);
    setResults(applySort(results));
  };

  const handleSearch = () => {
    runSearch();
  };

  return (
    <Layout>
      <main>
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="text-xs text-muted px-3 pt-2.5">
            <Link href="/" className="underline underline-offset-2">トップ</Link> / 検索結果
          </div>

          <div className="p-3 pt-3">
            <SearchBar onSearch={handleSearch} />
          </div>

          <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 border-t border-gray-200 bg-white flex-wrap">
            <div className="text-xs text-muted">検索結果 {results.length}件</div>
            <div className="flex gap-2.5">
              <select
                value={sortBy}
                onChange={handleSortChange}
                aria-label="並び替え"
                className="h-[34px] border border-gray-200 rounded-full px-2.5 bg-white"
              >
                <option value="live">おすすめ（価格変動→新規→更新）</option>
                <option value="updated_desc">更新が新しい順</option>
                <option value="price_asc">価格が安い順</option>
                <option value="price_desc">価格が高い順</option>
              </select>
            </div>
          </div>

          <ResultsList results={results} />
        </div>
      </main>
    </Layout>
  );
}
