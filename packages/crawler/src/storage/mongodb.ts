import { MongoClient, Db, Collection, WithId, Document } from 'mongodb';
import { BaseStorage, StorageConfig } from './base';
import { ProductInfo } from '../types';

interface ProductDocument extends Document {
  id: string;
  title: string;
  price: number;
  images: string[];
  url: string;
  specifications: Record<string, any>;
  seller: Record<string, any>;
  description: string;
  platform: string;
  timestamp: string;
}

export class MongoDBStorage extends BaseStorage {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<ProductDocument> | null = null;

  constructor(config: StorageConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    try {
      this.client = new MongoClient(this.config.uri, this.config.options);
      await this.client.connect();
      this.db = this.client.db('zaka');
      this.collection = this.db.collection<ProductDocument>('products');
      
      // 创建索引
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ platform: 1 });
      await this.collection.createIndex({ title: 'text', description: 'text' });
    } catch (error) {
      throw new Error(`Failed to initialize MongoDB storage: ${error}`);
    }
  }

  async saveProduct(product: ProductInfo): Promise<void> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      await this.collection.updateOne(
        { id: product.id },
        { $set: { ...product, updatedAt: new Date() } },
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
          update: { $set: { ...product, updatedAt: new Date() } },
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
      return await this.collection.findOne({ id }) as ProductInfo | null;
    } catch (error) {
      throw new Error(`Failed to get product: ${error}`);
    }
  }

  async searchProducts(query: any): Promise<ProductInfo[]> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      const { keyword, platform, minPrice, maxPrice, ...filters } = query;
      const searchQuery: any = { ...filters };

      if (keyword) {
        searchQuery.$text = { $search: keyword };
      }
      if (platform) {
        searchQuery.platform = platform;
      }
      if (minPrice !== undefined || maxPrice !== undefined) {
        searchQuery.price = {};
        if (minPrice !== undefined) searchQuery.price.$gte = minPrice;
        if (maxPrice !== undefined) searchQuery.price.$lte = maxPrice;
      }

      return await this.collection.find(searchQuery).toArray() as ProductInfo[];
    } catch (error) {
      throw new Error(`Failed to search products: ${error}`);
    }
  }

  async updateProduct(id: string, data: Partial<ProductInfo>): Promise<void> {
    if (!this.collection) throw new Error('Storage not initialized');
    
    try {
      await this.collection.updateOne(
        { id },
        { $set: { ...data, updatedAt: new Date() } }
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

  async findAll(searchQuery: Record<string, any> = {}): Promise<ProductInfo[]> {
    try {
      if (!this.collection) throw new Error('Storage not initialized');
      const results = await this.collection.find(searchQuery).toArray();
      return results.map(doc => ({
        id: doc.id,
        title: doc.title,
        price: doc.price,
        images: doc.images,
        url: doc.url,
        specifications: doc.specifications,
        seller: doc.seller,
        description: doc.description,
        platform: doc.platform,
        timestamp: doc.timestamp
      }));
    } catch (error) {
      throw new Error(`Failed to find products: ${error}`);
    }
  }
} 