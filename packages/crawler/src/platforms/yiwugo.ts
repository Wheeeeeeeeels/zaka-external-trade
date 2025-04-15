import { BasePlatform } from './base';
import { PlatformConfig, ProductInfo } from '../types';
import { PuppeteerCrawler } from '../engines/puppeteer';
import { Page } from 'puppeteer';

// @ts-ignore
type EvaluateContext = {
  document: Document;
  location: Location;
  Element: typeof Element;
  HTMLElement: typeof HTMLElement;
};

// @ts-ignore
declare global {
  interface Window {
    document: Document;
  }
}

export class YiwugoPlatform extends BasePlatform {
  private crawler: PuppeteerCrawler;
  private page: Page | null = null;

  constructor() {
    super({
      name: 'yiwugo',
      baseUrl: 'https://www.yiwugo.com',
      apiEndpoints: {
        search: '/search.html',
        product: '/product/',
        category: '/category/'
      }
    });

    this.crawler = new PuppeteerCrawler({
      baseUrl: this.config.baseUrl,
      timeout: 30000,
      retries: 3
    });
  }

  async initialize(): Promise<void> {
    await this.crawler.initialize();
    this.page = await this.crawler.getPage();
  }

  async getProductList(params: Record<string, string>): Promise<ProductInfo[]> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      const url = `${this.config.baseUrl}${this.config.apiEndpoints.search}?${searchParams.toString()}`;
      const response = await this.crawler.crawl(url);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      return this.parseProductList(response.data);
    } catch (error) {
      console.error(`Failed to get product list from Yiwugo: ${error}`);
      return [];
    }
  }

  async getProductDetail(id: string): Promise<ProductInfo> {
    try {
      const url = `${this.config.baseUrl}${this.config.apiEndpoints.product}${id}`;
      const response = await this.crawler.crawl(url);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      return this.parseProductDetail(response.data);
    } catch (error) {
      throw new Error(`Failed to get product detail from Yiwugo: ${error}`);
    }
  }

  async searchProducts(keyword: string): Promise<ProductInfo[]> {
    try {
      const url = `${this.config.baseUrl}${this.config.apiEndpoints.search}?keyword=${encodeURIComponent(keyword)}`;
      const response = await this.crawler.crawl(url);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      return this.parseProductList(response.data);
    } catch (error) {
      console.error(`Failed to search products from Yiwugo: ${error}`);
      return [];
    }
  }

  private async parseProductList(data: string): Promise<ProductInfo[]> {
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.waitForSelector('.product-list');
      
      const products = await this.page.$$eval('.product-item', items => {
        return items.map(item => {
          const title = item.querySelector('.product-title')?.textContent?.trim() || '';
          const price = item.querySelector('.product-price')?.textContent?.trim() || '';
          const image = item.querySelector('.product-image img')?.getAttribute('src') || '';
          const url = item.querySelector('a')?.getAttribute('href') || '';
          const id = url.split('/').pop()?.split('.')[0] || '';
          
          return {
            id,
            title,
            price: parseFloat(price.replace(/[^\d.]/g, '')),
            images: [image],
            url: url.startsWith('http') ? url : `https://www.yiwugo.com${url}`,
            specifications: {},
            seller: {},
            description: '',
            platform: 'yiwugo',
            timestamp: new Date().toISOString()
          };
        });
      });

      return products || [];
    } catch (error) {
      console.error(`Failed to parse product list: ${error}`);
      return [];
    }
  }

  private async parseProductDetail(data: string): Promise<ProductInfo> {
    try {
      if (!this.page) throw new Error('Page not initialized');
      
      await this.page.waitForSelector('.product-detail');

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
        seller.name = await this.page.$eval('.seller-info .seller-name', el => el.textContent?.trim() || '');
        seller.rating = await this.page.$eval('.seller-info .seller-rating', el => el.textContent?.trim() || '');
        seller.location = await this.page.$eval('.seller-info .seller-location', el => el.textContent?.trim() || '');
      }

      const url = await this.page.url();
      const pathname = new URL(url).pathname;
      const id = pathname.split('/').pop()?.split('.')[0] || '';
      
      const product = {
        id,
        title,
        price: parseFloat(price.replace(/[^\d.]/g, '')),
        description,
        images,
        specifications: specs,
        seller,
        url,
        platform: 'yiwugo',
        timestamp: new Date().toISOString()
      };

      if (!product) {
        throw new Error('Failed to parse product detail');
      }

      return product;
    } catch (error) {
      throw new Error(`Failed to parse product detail: ${error}`);
    }
  }

  async close(): Promise<void> {
    await this.crawler.close();
    this.page = null;
  }
}