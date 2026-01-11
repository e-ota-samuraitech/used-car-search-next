import type { Car } from '@/types';

// データソースのインターフェース
// 将来的にカーセンサーAPI/CloudSQL/Vertexに差し替え可能
export interface ICarDataSource {
  getAllCars(): Car[];
}
