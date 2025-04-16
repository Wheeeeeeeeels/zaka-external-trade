import { ProductInfo } from '../types';

export interface StorageConfig {
  type: 'mongodb' | 'mysql' | 'postgresql';
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  options?: Record<string, any>;
}

export interface IStorage {
  initialize(): Promise<void>;
  saveProduct(product: ProductInfo): Promise<void>;
  saveProducts(products: ProductInfo[]): Promise<void>;
  getProduct(id: string): Promise<ProductInfo | null>;
  getProducts(params: any): Promise<ProductInfo[]>;
  updateProduct(id: string, product: Partial<ProductInfo>): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  close(): Promise<void>;
} 