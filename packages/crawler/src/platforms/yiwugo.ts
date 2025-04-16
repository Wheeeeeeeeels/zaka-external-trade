import { BasePlatform } from './base';
import { PlatformConfig, ProductInfo } from '../types';
import { PuppeteerCrawler } from '../engines/puppeteer';
import { Page } from 'puppeteer';

export class YiwugoPlatform extends BasePlatform {
  private crawler: PuppeteerCrawler;
  private page: Page | null = null;

  constructor(config?: PlatformConfig) {
    super(config || {
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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      timeout: 30000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1'
      }
    });
  }

  async initialize(): Promise<void> {
    await this.crawler.initialize();
    this.page = await this.crawler.getPage();
    
    // 登录
    try {
      console.log('正在尝试登录...');
      await this.page.goto('https://login.yiwugo.com/login.html', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });
      
      // 等待登录表单加载
      await this.page.waitForSelector('#account');
      await this.page.waitForSelector('#password');
      
      // 输入账号密码
      await this.page.type('#account', '您的账号');  // 需要替换为实际的账号
      await this.page.type('#password', '您的密码');  // 需要替换为实际的密码
      
      // 点击登录按钮
      await this.page.click('.login-btn');
      
      // 等待登录完成
      await this.page.waitForNavigation({ 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });
      
      console.log('登录成功');
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  async getProductList(params: any): Promise<ProductInfo[]> {
    try {
      const { category, page = 1, pageSize = 48 } = params;
      const keyword = typeof params === 'string' ? params : category;
      const url = `https://www.yiwugo.com/search/s.html?cpage=${page}&keyword=${encodeURIComponent(keyword || '')}`;
      
      console.log(`正在访问URL: ${url}`);
      
      if (!this.page) throw new Error('Page not initialized');

      // 直接访问页面
      await this.page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });
      
      // 等待页面加载
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 获取页面内容
      const content = await this.page.content();
      console.log('页面内容长度:', content.length);
      
      // 使用更简单的选择器
      const products = await this.page.evaluate(() => {
        const items = document.querySelectorAll('a[href*="/product/"]');
        return Array.from(items).map(link => {
          const href = link.getAttribute('href') || '';
          const id = href.split('/').pop()?.split('.')[0] || '';
          const title = link.getAttribute('title') || link.textContent?.trim() || '';
          const url = href.startsWith('http') ? href : `https://www.yiwugo.com${href}`;
          
          // 获取价格
          const priceElement = link.closest('.item, .product, .goods')?.querySelector('.price, .pri_l, .price_num');
          const priceText = priceElement?.textContent?.trim() || '';
          const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
          
          // 获取图片
          const imageElement = link.closest('.item, .product, .goods')?.querySelector('img');
          const imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-original') || '';
          
          return {
            id,
            title,
            price,
            images: imageUrl ? [imageUrl] : [],
            url,
            specifications: {},
            seller: {},
            description: '',
            platform: 'yiwugo',
            timestamp: new Date().toISOString()
          };
        });
      });

      console.log(`找到 ${products.length} 个产品`);
      return products;
    } catch (error) {
      console.error('获取产品列表失败:', error);
      return [];
    }
  }

  async getProductDetail(id: string): Promise<ProductInfo> {
    try {
      const url = `https://www.yiwugo.com/product/${id}.html`;
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
      const url = `https://www.yiwugo.com/search/s.html?keyword=${encodeURIComponent(keyword)}`;
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

  private async extractProductList(data: string | undefined): Promise<ProductInfo[]> {
    try {
      if (!data) {
        console.warn('No data provided for extraction');
        return [];
      }
      if (!this.page) throw new Error('Page not initialized');

      console.log('Setting page content...');
      await this.page.setContent(data);
      console.log('Page content set');

      // 增加等待时间
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 更新选择器以匹配最新的DOM结构
      console.log('Waiting for product list...');
      const productSelectors = [
        '.pro_list_product_2013',
        '.product_box',
        '.search_prolist',
        '.proList',
        '.product-list',
        '.goods-list',
        '.item-list',
        '.product-item',
        '.item',
        '.product',
        '.goods',
        '.list-item',
        '[class*="product"]',
        '[class*="item"]',
        '[class*="goods"]'
      ];

      let foundSelector = null;
      for (const selector of productSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          foundSelector = selector;
          break;
        }
      }

      if (!foundSelector) {
        console.warn('No product list selector found');
        return [];
      }

      console.log(`Found product list with selector: ${foundSelector}`);

      // 打印页面内容以供调试
      console.log('Current page content:', await this.page.content());

      console.log('Extracting products...');
      const products = await this.page.$$eval('*[class*="product"], *[class*="item"], *[class*="goods"]', items => {
        console.log(`Found ${items.length} items`);
        return items.map(item => {
          // 获取产品标题
          const titleElement = item.querySelector('.proname, .title, a[title]');
          const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';
          console.log('Found title:', title);

          // 获取产品价格
          const priceElement = item.querySelector('.price_num, .price, .pri_l');
          const priceText = priceElement?.textContent?.trim() || '';
          const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
          console.log('Found price:', price);

          // 获取产品图片
          const imageElement = item.querySelector('.product_img img, .img img, img.lazy');
          let imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-original') || '';
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `https:${imageUrl}`;
          }
          console.log('Found image:', imageUrl);

          // 获取产品链接
          const linkElement = item.querySelector('a');
          let url = linkElement?.getAttribute('href') || '';
          if (url && !url.startsWith('http')) {
            url = `https://www.yiwugo.com${url}`;
          }
          console.log('Found URL:', url);

          // 从URL中提取产品ID
          const id = url.split('/').pop()?.split('.')[0] || '';
          console.log('Extracted ID:', id);

          return {
            id,
            title,
            price,
            images: [imageUrl],
            url,
            specifications: {},
            seller: {},
            description: '',
            platform: 'yiwugo',
            timestamp: new Date().toISOString()
          };
        });
      });

      console.log(`Extracted ${products.length} products`);
      return products || [];
    } catch (error) {
      console.error('Failed to extract product list:', error);
      return [];
    }
  }

  private async extractProductDetail(data: string | undefined): Promise<ProductInfo> {
    try {
      if (!data) {
        throw new Error('No data provided for extraction');
      }
      if (!this.page) throw new Error('Page not initialized');

      console.log('Setting page content for detail...');
      await this.page.setContent(data);
      console.log('Detail page content set');

      // 增加等待时间
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 获取产品标题
      const title = await this.page.$eval('.d-title, .proTitle, h1', el => el.textContent?.trim() || '').catch(() => '');
      console.log('Found title:', title);

      // 获取产品价格
      const price = await this.page.$eval('.d-price, .price, .pri_l', el => {
        const priceText = el.textContent?.trim() || '';
        return parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
      }).catch(() => 0);
      console.log('Found price:', price);

      // 获取产品描述
      const description = await this.page.$eval('.d-description, .description, .desc', el => el.textContent?.trim() || '').catch(() => '');
      console.log('Found description:', description);

      // 获取产品图片
      const images = await this.page.$$eval('.d-imgs img, .proImg img, .swiper-slide img', imgs => {
        return imgs.map(img => {
          let src = img.getAttribute('src') || img.getAttribute('data-original') || '';
          if (src && !src.startsWith('http')) {
            src = `https:${src}`;
          }
          return src;
        }).filter(src => src);
      }).catch(() => []);
      console.log('Found images:', images);

      // 获取产品规格
      const specifications = await this.page.$$eval('.d-parameter tr, .parameter tr, .attrs li', rows => {
        const specs: Record<string, string> = {};
        rows.forEach(row => {
          const key = row.querySelector('th, .name')?.textContent?.trim() || '';
          const value = row.querySelector('td, .value')?.textContent?.trim() || '';
          if (key && value) {
            specs[key] = value;
          }
        });
        return specs;
      }).catch(() => ({}));
      console.log('Found specifications:', specifications);

      // 获取卖家信息
      const seller = await this.page.evaluate(() => {
        const sellerName = document.querySelector('.supplier-name, .companyName')?.textContent?.trim() || '';
        const contactPerson = document.querySelector('.contact-person, .contactPerson')?.textContent?.trim() || '';
        const location = document.querySelector('.company-address, .address')?.textContent?.trim() || '';
        return {
          name: sellerName,
          contactPerson,
          location
        };
      }).catch(() => ({}));
      console.log('Found seller:', seller);

      // 获取产品URL和ID
      const url = await this.page.url();
      const id = url.split('/').pop()?.split('.')[0] || '';
      console.log('Found URL:', url);
      console.log('Extracted ID:', id);

      return {
        id,
        title,
        price,
        description,
        images,
        specifications,
        seller,
        url,
        platform: 'yiwugo',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to extract product detail:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.crawler.close();
    this.page = null;
  }
}