/// <reference types="jest" />
import { YiwugoPlatform } from '../platforms/yiwugo';
import { PlatformConfig } from '../types';

describe('YiwugoPlatform', () => {
  let platform: YiwugoPlatform;
  const config: PlatformConfig = {
    name: 'yiwugo',
    baseUrl: 'https://www.yiwugo.com',
    apiEndpoints: {
      search: '/search.html',
      product: '/product/',
      category: '/category/'
    }
  };

  beforeAll(async () => {
    platform = new YiwugoPlatform(config);
    await platform.initialize();
  }, 30000);

  afterAll(async () => {
    await platform.close();
  }, 30000);

  test('should search products', async () => {
    const products = await platform.searchProducts('手机壳');
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
      category: '手机配件',
      page: '1',
      pageSize: '48'
    });
    
    expect(products).toBeInstanceOf(Array);
    expect(products.length).toBeGreaterThan(0);
  }, 30000);

  test('should get product detail', async () => {
    // 首先搜索一个产品获取其 ID
    const products = await platform.searchProducts('手机壳');
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

  describe('getProductList', () => {
    it('should return empty array when data is undefined', async () => {
      const platform = new YiwugoPlatform();
      const result = await platform.getProductList(undefined);
      expect(result).toEqual([]);
    });

    it('should parse product list correctly', async () => {
      const mockHtml = `
        <div class="pro_list_product_2013">
          <div class="product_box">
            <a href="/product/123" class="product-title">测试商品</a>
            <div class="price">¥100</div>
            <img src="test.jpg" />
          </div>
        </div>
      `;
      
      const platform = new YiwugoPlatform();
      const result = await platform.getProductList(mockHtml);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('price');
      expect(result[0]).toHaveProperty('images');
    });
  });

  describe('getProductDetail', () => {
    it('should throw error for invalid input', async () => {
      const platform = new YiwugoPlatform();
      await expect(platform.getProductDetail('')).rejects.toThrow();
    });

    it('should parse product detail correctly', async () => {
      const mockHtml = `
        <div class="detail-content">
          <h1>测试商品详情</h1>
          <div class="price">¥200</div>
          <div class="description">商品描述</div>
          <img src="detail.jpg" />
        </div>
      `;
      
      const platform = new YiwugoPlatform();
      const result = await platform.getProductDetail(mockHtml);
      
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('images');
    });
  });
}); 