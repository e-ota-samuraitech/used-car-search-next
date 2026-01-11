import { mockCarDatabase } from '@/lib/mockCars';
import type { Car } from '@/types';
import type { ICarDataSource } from './interface';

// モックデータソース実装
// 将来的にカーセンサーAPI/CloudSQL/Vertexに差し替える
export class MockCarDataSource implements ICarDataSource {
  getAllCars(): Car[] {
    return mockCarDatabase;
  }
}
