import ResultCard from './ResultCard';
import Spinner from '@/components/common/Spinner';
import type { Car } from '@/types';

interface ResultsListProps {
  results: Car[];
  debugEnabled?: boolean;
  debugSource?: 'props' | 'context' | 'fallback';
  isNavigating?: boolean;
}

const ResultsList = ({ results, debugEnabled = false, debugSource = 'props', isNavigating = false }: ResultsListProps) => {
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
        <div className="p-3">
          <div className="border border-dashed border-gray-200 rounded-[14px] p-4 text-muted text-sm bg-white">
            条件に合う車両が見つかりませんでした。
          </div>
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
      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {results.map(car => (
          <ResultCard key={car.id} car={car} debugEnabled={debugEnabled} debugSource={debugSource} />
        ))}
      </div>
    </div>
  );
};

export default ResultsList;
