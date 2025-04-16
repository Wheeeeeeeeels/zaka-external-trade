/// <reference types="jest" />
import { DhgatePlatform } from '../platforms/dhgate';
import { PlatformConfig } from '../types';

describe('DhgatePlatform', () => {
  let platform: DhgatePlatform;
  const config: PlatformConfig = {
    name: 'dhgate',
    baseUrl: 'https://www.dhgate.com',
    apiEndpoints: {
      search: '/wholesale/search.do',
      product: '/product/',
      category: '/category/'
    }
  };

  beforeAll(async () => {
    platform = new DhgatePlatform(config);
    await platform.initialize();
  }, 30000);

  afterAll(async () => {
    await platform.close();
  }, 30000);

  test('should search products', async () => {
    const products = await platform.searchProducts('phone case');
    expect(products).toBeInstanceOf(Array);
    expect(products.length).toBeGreaterThan(0);
    
    const product = products[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('title');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('images');
    expect(product).toHaveProperty('url');
  }, 30000);

  test('should get product list by category', async () => {
    const products = await platform.getProductList({
      category: 'Phone Accessories',
      page: '1',
      pageSize: '48'
    });
    
    expect(products).toBeInstanceOf(Array);
    expect(products.length).toBeGreaterThan(0);
  }, 30000);

  test('should get product detail', async () => {
    // 首先搜索一个产品获取其 ID
    const products = await platform.searchProducts('phone case');
    expect(products.length).toBeGreaterThan(0);
    
    const productId = products[0].id;
    const product = await platform.getProductDetail(productId);
    
    expect(product).toHaveProperty('id', productId);
    expect(product).toHaveProperty('title');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('description');
    expect(product).toHaveProperty('images');
    expect(product).toHaveProperty('specifications');
  }, 30000);
}); 