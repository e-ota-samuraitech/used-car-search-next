import { useEffect, ChangeEvent, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/common/Layout';
import SearchBar from '@/components/results/SearchBar';
import ResultsList from '@/components/results/ResultsList';
import Filters from '@/components/filters/Filters';
import { useApp } from '@/context/AppContext';
import type { SortBy } from '@/types';

export default function ResultsPage() {
  const { results, sortBy, setSortBy, runSearch, applySort, setResults } = useApp();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);

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
    <Layout showFilters={false}>
      <div className="w-full">
        {/* ページ上部の検索バー */}
        <div className="mb-3 border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden p-3">
          <div className="text-xs text-muted mb-2">
            <Link href="/" className="underline underline-offset-2">トップ</Link> / 検索結果
          </div>
          <SearchBar onSearch={handleSearch} variant="compact" />
        </div>

        {/* スマホ版：絞り込み欄（折りたたみ式） */}
        <div className="mb-3 lg:hidden">
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              type="button"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium">絞り込み検索</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${isMobileFilterOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isMobileFilterOpen && (
              <div className="border-t border-gray-200">
                <Filters isOpen={true} />
              </div>
            )}
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className={`grid grid-cols-1 gap-3.5 ${isFilterSidebarOpen ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
          {/* 左側：検索結果 */}
          <main>
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              {/* ツールバー：PC版の絞り込み開閉ボタンとソート */}
              <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 border-b border-gray-200 bg-white flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* PC版の絞り込み開閉ボタン */}
                  <button
                    onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                    className="hidden lg:flex h-[34px] px-3 rounded-full border border-gray-200 bg-white cursor-pointer items-center gap-1.5 hover:bg-gray-50 transition-colors text-sm"
                    type="button"
                  >
                    {isFilterSidebarOpen ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>閉じる</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span>絞り込み</span>
                      </>
                    )}
                  </button>
                  <div className="text-xs text-gray-600">検索結果 {results.length}件</div>
                </div>
                <div className="flex gap-2.5">
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    aria-label="並び替え"
                    className="h-[34px] border border-gray-200 rounded-full px-2.5 bg-white text-sm"
                  >
                    <option value="live">おすすめ（価格変動→新規→更新）</option>
                    <option value="updated_desc">更新が新しい順</option>
                    <option value="price_asc">価格が安い順</option>
                    <option value="price_desc">価格が高い順</option>
                  </select>
                </div>
              </div>

              {/* 検索結果リスト */}
              <ResultsList results={results} />
            </div>
          </main>

          {/* 右側：絞り込みフィルター（PC版サイドバー） */}
          <aside className="hidden lg:block">
            <Filters isOpen={isFilterSidebarOpen} />
          </aside>
        </div>
      </div>
    </Layout>
  );
}
