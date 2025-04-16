import { ProductInfo } from '../types';

export interface StorageConfig {
  uri: string;
  options?: Record<string, any>;
}

export abstract class BaseStorage {
  protected config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract saveProduct(product: ProductInfo): Promise<void>;
  abstract saveProducts(products: ProductInfo[]): Promise<void>;
  abstract getProduct(id: string): Promise<ProductInfo | null>;
  abstract searchProducts(query: any): Promise<ProductInfo[]>;
  abstract updateProduct(id: string, data: Partial<ProductInfo>): Promise<void>;
  abstract deleteProduct(id: string): Promise<void>;
  abstract close(): Promise<void>;
} 