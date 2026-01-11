import { ChangeEvent } from 'react';
import type { Shop, Car, SortBy } from '@/types';
import ResultCard from '@/components/results/ResultCard';

interface ShopDetailProps {
  shop: Shop | null;
  cars: Car[];
  sortBy: SortBy;
  onSortChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const ShopDetail = ({ shop, cars, sortBy, onSortChange }: ShopDetailProps) => {
  if (!shop) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted">店舗情報が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div>
      {/* 店舗情報セクション */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h1 className="text-2xl font-bold mb-3">{shop.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="flex gap-2 mb-2">
              <span className="text-muted w-20">住所:</span>
              <span>{shop.address}</span>
            </div>
            <div className="flex gap-2 mb-2">
              <span className="text-muted w-20">電話:</span>
              <span>{shop.tel}</span>
            </div>
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              <span className="text-muted w-20">営業時間:</span>
              <span>{shop.hours}</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm text-gray-700">{shop.description}</p>
        </div>
      </div>

      {/* 取扱車両セクション */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2.5 mb-3 flex-wrap">
          <h2 className="text-lg font-bold">この店舗の取扱車両 ({cars.length}台)</h2>
          <div className="flex gap-2.5">
            <select
              value={sortBy}
              onChange={onSortChange}
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

        {cars.length === 0 ? (
          <div className="text-center py-8 text-muted">
            現在、この店舗の取扱車両はありません。
          </div>
        ) : (
          <div className="space-y-3">
            {cars.map(car => (
              <ResultCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetail;
