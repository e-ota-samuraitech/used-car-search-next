import ResultCard from './ResultCard';
import type { Car } from '@/types';

interface ResultsListProps {
  results: Car[];
}

const ResultsList = ({ results }: ResultsListProps) => {
  if (!results || results.length === 0) {
    return (
      <div className="p-3">
        <div className="border border-dashed border-gray-200 rounded-[14px] p-4 text-muted text-sm bg-white">
          条件に合う車両が見つかりませんでした。
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 grid grid-cols-1 gap-2.5">
      {results.map(car => (
        <ResultCard key={car.id} car={car} />
      ))}
    </div>
  );
};

export default ResultsList;
