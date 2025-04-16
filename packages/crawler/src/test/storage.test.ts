/// <reference types="jest" />
import { StorageFactory, StorageType } from '../storage/factory';
import { ProductInfo } from '../types';

describe('Storage', () => {
  let storage: any;
  const config = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  };

  const testProduct: ProductInfo = {
    id: 'test-1',
    title: 'Test Product',
    price: 100,
    description: 'Test Description',
    images: ['http://example.com/image.jpg'],
    specifications: {
      color: 'red',
      size: 'M'
    },
    seller: {
      name: 'Test Seller',
      rating: 4.5
    },
    platform: 'test',
    url: 'http://example.com/product',
    timestamp: new Date().toISOString()
  };

  beforeAll(async () => {
    storage = StorageFactory.createStorage(StorageType.MongoDB, config);
    await storage.initialize();
  }, 30000);

  afterAll(async () => {
    await storage.close();
  }, 30000);

  beforeEach(async () => {
    // 清理测试数据
    await storage.deleteProduct(testProduct.id);
  }, 30000);

  test('should save and retrieve product', async () => {
    // 保存产品
    await storage.saveProduct(testProduct);

    // 获取产品
    const retrieved = await storage.getProduct(testProduct.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved.id).toBe(testProduct.id);
    expect(retrieved.title).toBe(testProduct.title);
  }, 30000);

  test('should save multiple products', async () => {
    const products: ProductInfo[] = [
      testProduct,
      {
        ...testProduct,
        id: 'test-2',
        title: 'Test Product 2'
      }
    ];

    await storage.saveProducts(products);

    const retrieved1 = await storage.getProduct('test-1');
    const retrieved2 = await storage.getProduct('test-2');

    expect(retrieved1).not.toBeNull();
    expect(retrieved2).not.toBeNull();
    expect(retrieved1.title).toBe('Test Product');
    expect(retrieved2.title).toBe('Test Product 2');
  }, 30000);

  test('should search products', async () => {
    await storage.saveProduct(testProduct);

    const results = await storage.searchProducts({
      keyword: 'Test',
      platform: 'test'
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe(testProduct.id);
  }, 30000);

  test('should update product', async () => {
    await storage.saveProduct(testProduct);

    const newTitle = 'Updated Test Product';
    await storage.updateProduct(testProduct.id, { title: newTitle });

    const updated = await storage.getProduct(testProduct.id);
    expect(updated.title).toBe(newTitle);
  }, 30000);

  test('should delete product', async () => {
    await storage.saveProduct(testProduct);
    await storage.deleteProduct(testProduct.id);

    const deleted = await storage.getProduct(testProduct.id);
    expect(deleted).toBeNull();
  }, 30000);
}); 