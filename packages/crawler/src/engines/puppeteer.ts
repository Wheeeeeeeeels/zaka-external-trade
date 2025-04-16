import puppeteer, { Browser, Page, HTTPRequest } from 'puppeteer';
import { BaseCrawler } from './base';
import { CrawlerOptions, ProxyConfig, CrawlerResponse } from '../types';

export class PuppeteerCrawler extends BaseCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(options: CrawlerOptions) {
    super(options);
  }

  async initialize(): Promise<void> {
    try {
      const launchOptions = {
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--window-size=1920,1080',
          '--start-maximized'
        ]
      };

      if (this.options.proxy) {
        const { host, port, username, password } = this.options.proxy;
        if (host && port) {
          launchOptions.args.push(`--proxy-server=${host}:${port}`);
        }
      }

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();

      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.setRequestInterception(true);

      if (this.options.proxy && this.options.proxy.username && this.options.proxy.password) {
        await this.page.authenticate({
          username: this.options.proxy.username,
          password: this.options.proxy.password
        });
      }

      if (this.options.headers) {
        await this.page.setExtraHTTPHeaders(this.options.headers);
      }

      await this.page.setJavaScriptEnabled(true);

      await this.page.setCookie({
        name: 'cookieconsent_status',
        value: 'dismiss',
        domain: '.yiwugo.com'
      });

      this.page.on('request', (request: HTTPRequest) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
      });

    } catch (error) {
      throw new Error(`Failed to initialize Puppeteer: ${error}`);
    }
  }

  async crawl(url: string): Promise<CrawlerResponse> {
    try {
      if (!this.page) {
        await this.initialize();
      }

      if (!this.page) {
        throw new Error('Page not initialized');
      }

      await this.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: this.options.timeout || 30000
      });

      const content = await this.page.content();
      return {
        success: true,
        data: content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async getPage(): Promise<Page> {
    if (!this.page) {
      await this.initialize();
    }
    if (!this.page) {
      throw new Error('Failed to initialize page');
    }
    return this.page;
  }
}
