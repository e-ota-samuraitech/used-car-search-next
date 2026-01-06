const DAY = 24 * 60 * 60 * 1000;

export const yen = (n: number): string => new Intl.NumberFormat("ja-JP").format(n);

export const withinDays = (ts: number, d: number): boolean => (Date.now() - ts) <= d * DAY;

export const minutesAgo = (ts: number): number => Math.max(0, Math.floor((Date.now() - ts) / 60000));

export const hoursAgo = (ts: number): number => Math.max(0, Math.floor((Date.now() - ts) / 3600000));

export const daysAgo = (ts: number): number => Math.max(0, Math.floor((Date.now() - ts) / DAY));

export function formatAgo(ts: number): string {
  const m = minutesAgo(ts);
  if (m < 60) return `${m}分前`;
  const h = hoursAgo(ts);
  if (h < 24) return `${h}時間前`;
  return `${daysAgo(ts)}日前`;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

import type { Car } from '@/types';

export function computeLiveScore(car: Car): number {
  const priceChangedRecent = car.priceChangedAt && withinDays(car.priceChangedAt, 1);
  const postedRecent = withinDays(car.postedAt, 2);

  let score = 0;
  if (priceChangedRecent) score += 1000000;
  if (postedRecent) score += 200000;
  score += Math.max(0, 100000 - Math.floor((Date.now() - car.updatedAt) / 60000));
  return score;
}
