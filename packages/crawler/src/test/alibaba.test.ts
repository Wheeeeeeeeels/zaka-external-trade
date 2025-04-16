/// <reference types="jest" />
import { AlibabaPlatform } from '../platforms/alibaba';
import { PlatformConfig } from '../types';

describe('AlibabaPlatform', () => {
  let platform: AlibabaPlatform;
  const config: PlatformConfig = {
    name: 'alibaba',
    baseUrl: 'https://www.alibaba.com',
    apiEndpoints: {
      search: '/trade/search',
      product: '/product/',
      category: '/category/'
    }
  };

  beforeAll(async () => {
    platform = new AlibabaPlatform(config);
    await platform.initialize();
  }, 30000);

  afterAll(async () => {
    await platform.close();
  }, 30000);

  describe('搜索功能', () => {
    it('应该能够搜索产品', async () => {
      const products = await platform.searchProducts('mobile phone');
      expect(products).toBeInstanceOf(Array);
      expect(products.length).toBeGreaterThan(0);
      
      const product = products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('images');
      expect(product).toHaveProperty('url');
    });

    it('搜索空关键词应该返回空数组', async () => {
      const products = await platform.searchProducts('');
      expect(products).toEqual([]);
    });
  });

  describe('分类功能', () => {
    it('应该能够按类别获取产品列表', async () => {
      const products = await platform.getProductList({
        category: 'Electronics',
        page: 1,
        pageSize: 48
      });
      
      expect(products).toBeInstanceOf(Array);
      expect(products.length).toBeGreaterThan(0);
    });

    it('无效的类别应该返回空数组', async () => {
      const products = await platform.getProductList({
        category: 'InvalidCategory',
        page: 1,
        pageSize: 48
      });
      
      expect(products).toEqual([]);
    });
  });

  describe('产品详情', () => {
    it('应该能够获取产品详情', async () => {
      const products = await platform.searchProducts('mobile phone');
      expect(products.length).toBeGreaterThan(0);
      
      const productId = products[0].id;
      const product = await platform.getProductDetail(productId);
      
      expect(product).toHaveProperty('id', productId);
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('images');
      expect(product).toHaveProperty('specifications');
    });

    it('无效的产品ID应该抛出错误', async () => {
      await expect(platform.getProductDetail('invalid-id')).rejects.toThrow();
    });
  });
}); 