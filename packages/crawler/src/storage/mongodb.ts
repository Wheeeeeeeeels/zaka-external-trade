import { MongoClient, Db, Collection } from 'mongodb';
import { IStorage, StorageConfig } from './types';
import { ProductInfo } from '../types';

export class MongoDBStorage implements IStorage {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<ProductInfo> | null = null;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      const url = this.getMongoUrl();
      this.client = new MongoClient(url);
      await this.client.connect();
      
      this.db = this.client.db(this.config.database);
      this.collection = this.db.collection<ProductInfo>('products');
      
      // 创建索引
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ platform: 1 });
      await this.collection.createIndex({ timestamp: 1 });
    } catch (error) {
      throw new Error(`Failed to initialize MongoDB storage: ${error}`);
    }
  }

  private getMongoUrl(): string {
    const { host, port, username, password, database } = this.config;
    const auth = username && password ? `${username}:${password}@` : '';
    return `mongodb://${auth}${host}:${port}/${database}`;
  }

  async saveProduct(product: ProductInfo): Promise<void> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      await this.collection.updateOne(
        { id: product.id },
        { $set: product },
        { upsert: true }
      );
    } catch (error) {
      throw new Error(`Failed to save product: ${error}`);
    }
  }

  async saveProducts(products: ProductInfo[]): Promise<void> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      const operations = products.map(product => ({
        updateOne: {
          filter: { id: product.id },
          update: { $set: product },
          upsert: true
        }
      }));
      
      await this.collection.bulkWrite(operations);
    } catch (error) {
      throw new Error(`Failed to save products: ${error}`);
    }
  }

  async getProduct(id: string): Promise<ProductInfo | null> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      return await this.collection.findOne({ id });
    } catch (error) {
      throw new Error(`Failed to get product: ${error}`);
    }
  }

  async getProducts(params: any): Promise<ProductInfo[]> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      const query: any = {};
      
      if (params.platform) {
        query.platform = params.platform;
      }
      
      if (params.keyword) {
        query.$text = { $search: params.keyword };
      }
      
      if (params.minPrice) {
        query.price = { ...query.price, $gte: params.minPrice };
      }
      
      if (params.maxPrice) {
        query.price = { ...query.price, $lte: params.maxPrice };
      }
      
      return await this.collection.find(query).toArray();
    } catch (error) {
      throw new Error(`Failed to get products: ${error}`);
    }
  }

  async updateProduct(id: string, product: Partial<ProductInfo>): Promise<void> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      await this.collection.updateOne(
        { id },
        { $set: product }
      );
    } catch (error) {
      throw new Error(`Failed to update product: ${error}`);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      await this.collection.deleteOne({ id });
    } catch (error) {
      throw new Error(`Failed to delete product: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.collection = null;
    }
  }
} 