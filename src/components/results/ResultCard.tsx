import { useRouter } from 'next/router';
import Link from 'next/link';
import { yen, formatAgo } from '@/utils/helpers';
import type { Car } from '@/types';
import { encodeShopSlug } from '@/lib/shops/slug';

interface ResultCardProps {
  car: Car;
  debugEnabled?: boolean;
  debugSource?: 'props' | 'context' | 'fallback';
}

const ResultCard = ({ car, debugEnabled = false, debugSource = 'props' }: ResultCardProps) => {
  const router = useRouter();

  const delta = car.priceYen - car.prevPriceYen;
  const hasDelta = car.prevPriceYen !== car.priceYen;
  const deltaClass = delta > 0 ? 'text-up' : delta < 0 ? 'text-down' : '';
  const deltaText = delta === 0 ? '' : delta > 0 ? `+${yen(delta)}` : `${yen(delta)}`;

  const handleCardClick = () => {
    router.push(`/cars/d-${car.id}/?from=${encodeURIComponent(router.asPath)}`);
  };

  const handleEstimateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/estimate/${car.id}`);
  };

  return (
    <div
      className="grid grid-cols-[120px_1fr] gap-3 border border-gray-200 rounded-[14px] p-2.5 bg-white cursor-pointer hover:border-gray-300"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      data-debug-source={debugEnabled ? debugSource : undefined}
      data-debug-id={debugEnabled ? car.id : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
    >
      <div 
        className="w-[120px] h-[80px] rounded-xl bg-gradient-to-br from-gray-100 to-white border border-gray-200 flex items-center justify-center text-muted text-xs overflow-hidden"
        aria-hidden="true"
      >
        画像
      </div>
      <div>
        {debugEnabled && (
          <div className="mb-1 text-[10px] text-gray-500">
            source: {debugSource} / id: {car.id}
          </div>
        )}
        <h4 className="m-0 mb-1 text-sm font-extrabold leading-tight">
          {car.maker} {car.model}（{car.year}）
        </h4>
        <div className="flex gap-2.5 items-baseline flex-wrap">
          <div className="font-extrabold text-base">¥{yen(car.priceYen)}</div>
          {hasDelta ? (
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border border-gray-200 tabular-nums ${deltaClass}`}>
              {deltaText}（{car.priceChangedAt ? formatAgo(car.priceChangedAt) : '更新'}）
            </span>
          ) : (
            <span className="text-xs text-muted">価格変動なし</span>
          )}
          <div className="text-xs text-muted">
            📍 {car.region}｜{car.pref} {car.city}｜更新 {formatAgo(car.updatedAt)}
          </div>
        </div>
        <div className="mt-1.5 flex gap-x-3 gap-y-1 flex-wrap text-xs text-muted">
          <span>{(car.mileage / 10000).toFixed(1)}万km</span>
          <span>修復歴: {car.hasRepairHistory ? 'あり' : 'なし'}</span>
          <span>整備: {car.hasInspection ? '付き' : 'なし'}</span>
          <span>車検: {car.shaken}</span>
          <span>保証: {car.warranty}</span>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap items-center">
          <button
            className="inline-flex items-center justify-center gap-2 text-xs h-[34px] px-3 rounded-full border-0 bg-accent text-white cursor-pointer whitespace-nowrap font-extrabold"
            onClick={handleEstimateClick}
            type="button"
          >
            今すぐ見積もり
          </button>
          <span className="text-xs text-muted">
            店舗：
            <Link
              href={`/shops/${encodeShopSlug(car.shop)}/`}
              className="underline underline-offset-2 hover:text-accent"
              onClick={(e) => e.stopPropagation()}
            >
              {car.shop}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
