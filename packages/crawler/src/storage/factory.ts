import { BaseStorage, StorageConfig } from './base';
import { MongoDBStorage } from './mongodb';

export enum StorageType {
  MongoDB = 'mongodb',
  // 可以添加其他存储类型
}

export class StorageFactory {
  static createStorage(type: StorageType, config: StorageConfig): BaseStorage {
    switch (type) {
      case StorageType.MongoDB:
        return new MongoDBStorage(config);
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
} 