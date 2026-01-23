import ResultCard from './ResultCard';
import Spinner from '@/components/common/Spinner';
import type { Car } from '@/types';

interface ResultsListProps {
  results: Car[];
  cardVariant?: 'horizontal' | 'vertical';
  debugEnabled?: boolean;
  debugSource?: 'props' | 'context' | 'fallback';
  isNavigating?: boolean;
}

const ResultsList = ({ results, cardVariant = 'vertical', debugEnabled = false, debugSource = 'props', isNavigating = false }: ResultsListProps) => {
  if (!results || results.length === 0) {
    return (
      <div className="relative">
        {isNavigating && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Spinner size="md" />
              <span className="text-sm font-medium">検索中…</span>
            </div>
          </div>
        )}
        <div className="text-center py-16">
          <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm md:text-base text-gray-600">検索結果が見つかりませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isNavigating && (
        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Spinner size="md" />
            <span className="text-sm font-medium">検索中…</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {results.map(car => (
          <ResultCard key={car.id} car={car} variant={cardVariant} debugEnabled={debugEnabled} debugSource={debugSource} />
        ))}
      </div>
    </div>
  );
};

export default ResultsList;
