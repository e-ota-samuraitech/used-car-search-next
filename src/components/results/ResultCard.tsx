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

// SVG Icons (inline to avoid external dependencies)
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SpeedIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const StoreIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

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
      className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      data-debug-source={debugEnabled ? debugSource : undefined}
      data-debug-id={debugEnabled ? car.id : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
    >
      {/* Horizontal layout: image left, content right */}
      <div className="flex">
        {/* Image Placeholder */}
        <div
          className="w-32 md:w-40 h-28 md:h-36 bg-gray-100 flex-shrink-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-gray-400 text-xs">No Image</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 md:p-4 min-w-0">
          {debugEnabled && (
            <div className="mb-1 text-[10px] text-gray-500">
              source: {debugSource} / id: {car.id}
            </div>
          )}

          {/* Posted time */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-gray-500">{formatAgo(car.postedAt)}</span>
            {hasDelta && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${delta < 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {deltaText}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-medium text-gray-800 mb-2 text-sm line-clamp-1">
            {car.maker} {car.model}（{car.year}年式）
          </h3>

          {/* Price */}
          <div className="text-base md:text-lg font-bold text-accent mb-2">
            ¥{yen(car.priceYen)}
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{car.year}年</span>
              </div>
              <div className="flex items-center gap-1">
                <SpeedIcon className="w-3.5 h-3.5" />
                <span>{(car.mileage / 10000).toFixed(1)}万km</span>
              </div>
              <div className="flex items-center gap-1">
                <LocationIcon className="w-3.5 h-3.5" />
                <span>{car.pref}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <StoreIcon className="w-3.5 h-3.5" />
              <Link
                href={`/shops/${encodeShopSlug(car.shop)}/`}
                className="hover:text-accent hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {car.shop}
              </Link>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3">
            <button
              className="px-4 py-1.5 bg-accent text-white text-xs font-medium rounded-full hover:bg-accent/90 transition-colors"
              onClick={handleEstimateClick}
              type="button"
            >
              見積もり
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
