import { BasePlatform } from './base';
import { PlatformConfig, ProductInfo, RawProduct } from '../types';
import { PuppeteerCrawler } from '../engines/puppeteer';
import { Page } from 'puppeteer';

export class DhgatePlatform extends BasePlatform {
  private crawler: PuppeteerCrawler;
  private page: Page | null = null;

  constructor(config: PlatformConfig) {
    super(config);
    this.crawler = new PuppeteerCrawler({
      baseUrl: config.baseUrl,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      timeout: 30000
    });
  }

  async initialize(): Promise<void> {
    await this.crawler.initialize();
    this.page = await this.crawler.getPage();
  }

  async getProductList(params: any): Promise<ProductInfo[]> {
    try {
      const { category, page = 1, pageSize = 48 } = params;
      const url = `https://www.dhgate.com/wholesale/search.do?act=search&sus=&sus2=&searchkey=${encodeURIComponent(category)}&catalog=&seatype=2&page=${page}`;
      
      const response = await this.crawler.crawl(url);
      if (!response.success) {
        throw new Error(response.error);
      }

      const products = await this.extractProductList(response.data);
      return products;
    } catch (error) {
      console.error('Failed to get product list:', error);
      return [];
    }
  }

  async getProductDetail(id: string): Promise<ProductInfo> {
    try {
      const url = `https://www.dhgate.com/product/${id}.html`;
      const response = await this.crawler.crawl(url);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      const product = await this.extractProductDetail(response.data);
      return product;
    } catch (error) {
      console.error('Failed to get product detail:', error);
      throw error;
    }
  }

  async searchProducts(keyword: string): Promise<ProductInfo[]> {
    try {
      const url = `https://www.dhgate.com/wholesale/search.do?act=search&sus=&sus2=&searchkey=${encodeURIComponent(keyword)}&catalog=&seatype=2`;
      const response = await this.crawler.crawl(url);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      const products = await this.extractProductList(response.data);
      return products;
    } catch (error) {
      console.error('Failed to search products:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    await this.crawler.close();
    this.page = null;
  }

  private async extractProductList(data: string | undefined): Promise<ProductInfo[]> {
    try {
      if (!data) return [];
      if (!this.page) throw new Error('Page not initialized');

      const products = await this.page.$$eval('.product-item', items => {
        return items.map(item => {
          const title = item.querySelector('.title')?.textContent?.trim() || '';
          const price = item.querySelector('.price')?.textContent?.trim() || '';
          const image = item.querySelector('.image img')?.getAttribute('src') || '';
          const url = item.querySelector('a')?.getAttribute('href') || '';
          const id = url.split('/').pop()?.split('.')[0] || '';

          return {
            id,
            title,
            price: parseFloat(price.replace(/[^\d.]/g, '')),
            images: [image],
            url: url.startsWith('http') ? url : `https://www.dhgate.com${url}`,
            specifications: {},
            seller: {},
            description: '',
            platform: 'dhgate',
            timestamp: new Date().toISOString()
          };
        });
      });

      return products || [];
    } catch (error) {
      console.error('Failed to extract product list:', error);
      return [];
    }
  }

  private async extractProductDetail(data: string | undefined): Promise<ProductInfo> {
    try {
      if (!data) throw new Error('No data to parse');
      if (!this.page) throw new Error('Page not initialized');

      const title = await this.page.$eval('.product-title', el => el.textContent?.trim() || '');
      const price = await this.page.$eval('.product-price', el => el.textContent?.trim() || '');
      const description = await this.page.$eval('.product-description', el => el.textContent?.trim() || '');
      const images = await this.page.$$eval('.product-images img', imgs => imgs.map(img => img.getAttribute('src') || ''));

      const specs: Record<string, string> = {};
      const rows = await this.page.$$('.product-specs tr');
      for (const row of rows) {
        const key = await row.$eval('th', el => el.textContent?.trim() || '');
        const value = await row.$eval('td', el => el.textContent?.trim() || '');
        if (key && value) {
          specs[key] = value;
        }
      }

      const seller: Record<string, string> = {};
      const sellerInfo = await this.page.$('.seller-info');
      if (sellerInfo) {
        seller.name = await this.page.$eval('.seller-name', el => el.textContent?.trim() || '');
        seller.rating = await this.page.$eval('.seller-rating', el => el.textContent?.trim() || '');
        seller.location = await this.page.$eval('.seller-location', el => el.textContent?.trim() || '');
      }

      const url = await this.page.url();
      const pathname = new URL(url).pathname;
      const id = pathname.split('/').pop()?.split('.')[0] || '';

      return {
        id,
        title,
        price: parseFloat(price.replace(/[^\d.]/g, '')),
        description,
        images,
        specifications: specs,
        seller,
        url,
        platform: 'dhgate',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to extract product detail: ${error}`);
    }
  }
} 