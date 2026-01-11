import { useRouter } from 'next/router';
import Link from 'next/link';
import { yen, formatAgo } from '@/utils/helpers';
import type { Car } from '@/types';

interface CarDetailProps {
  car: Car | null;
}

const CarDetail = ({ car }: CarDetailProps) => {
  const router = useRouter();

  if (!car) {
    return (
      <div className="p-3">
        <div className="border border-dashed border-gray-200 rounded-[14px] p-4 text-muted text-sm bg-white">
          車両が見つかりません。
        </div>
      </div>
    );
  }

  const delta = car.priceYen - car.prevPriceYen;
  const hasDelta = car.prevPriceYen !== car.priceYen;
  const deltaClass = delta > 0 ? 'text-up' : delta < 0 ? 'text-down' : '';
  const deltaText = delta === 0 ? '' : delta > 0 ? `+${yen(delta)}` : `${yen(delta)}`;

  return (
    <div className="p-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2.5">
        <div className="border border-gray-200 rounded-[14px] p-3 bg-white">
          <div className="h-[220px] rounded-[14px] border border-gray-200 bg-gradient-to-br from-gray-100 to-white flex items-center justify-center text-muted font-extrabold">
            画像（ダミー）
          </div>
        </div>

        <div className="border border-gray-200 rounded-[14px] p-3 bg-white">
          <h1 className="m-0 mb-1.5 text-base font-extrabold">
            {car.maker} {car.model}（{car.year}）
          </h1>

          <div className="flex gap-2.5 items-baseline flex-wrap my-1.5 mb-2.5">
            <div className="font-extrabold text-base">¥{yen(car.priceYen)}</div>
            {hasDelta ? (
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border border-gray-200 tabular-nums ${deltaClass}`}>
                {deltaText}（{car.priceChangedAt ? formatAgo(car.priceChangedAt) : '更新'}）
              </span>
            ) : (
              <span className="text-xs text-muted">価格変動なし</span>
            )}
            <div className="text-xs text-muted">更新 {formatAgo(car.updatedAt)}</div>
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
            <div className="text-muted">走行距離</div>
            <div>{(car.mileage / 10000).toFixed(1)}万km</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
            <div className="text-muted">修復歴</div>
            <div>{car.hasRepairHistory ? 'あり' : 'なし'}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
            <div className="text-muted">法定整備</div>
            <div>{car.hasInspection ? '付き' : 'なし'}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
            <div className="text-muted">車検有無</div>
            <div>{car.shaken}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
            <div className="text-muted">保証</div>
            <div>{car.warranty}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
            <div className="text-muted">地域</div>
            <div>{car.region}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
            <div className="text-muted">都道府県</div>
            <div>{car.pref}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5 border-b border-gray-200">
            <div className="text-muted">市区町村</div>
            <div>{car.city}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1.5">
            <div className="text-muted">店舗</div>
            <div>
              <Link
                href={`/shop/${encodeURIComponent(car.shop)}`}
                className="underline underline-offset-2 hover:text-accent"
              >
                {car.shop}
              </Link>
            </div>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap items-center">
            <button
              className="inline-flex items-center justify-center gap-2 text-xs h-[34px] px-3 rounded-full border border-gray-200 bg-white cursor-pointer whitespace-nowrap"
              onClick={() => router.push('/results')}
              type="button"
            >
              検索結果へ戻る
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 text-xs h-[34px] px-3 rounded-full border-0 bg-accent text-white cursor-pointer whitespace-nowrap font-extrabold"
              onClick={() => router.push(`/estimate/${car.id}`)}
              type="button"
            >
              見積もり申し込み
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetail;
