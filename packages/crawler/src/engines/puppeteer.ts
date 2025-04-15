import puppeteer, { Browser, Page, Request } from 'puppeteer';
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
      const launchOptions: puppeteer.LaunchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
        ]
      };

      if (this.proxy) {
        launchOptions.args.push(
          `--proxy-server=${this.proxy.host}:${this.proxy.port}`
        );
      }

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();
      await this.setupPage();
    } catch (error) {
      throw new Error(`Failed to initialize PuppeteerCrawler: ${error}`);
    }
  }

  private async setupPage(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    await this.page.setViewport({ width: 1920, height: 1080 });

    if (this.options.userAgent) {
      await this.page.setUserAgent(this.options.userAgent);
    }

    if (this.options.timeout) {
      this.page.setDefaultTimeout(this.options.timeout);
      this.page.setDefaultNavigationTimeout(this.options.timeout);
    }

    if (this.proxy?.username && this.proxy?.password) {
      await this.page.authenticate({
        username: this.proxy.username,
        password: this.proxy.password
      });
    }

    if (this.options.cookies) {
      const domain = new URL(this.options.baseUrl || '').hostname;
      await this.page.setCookie(...Object.entries(this.options.cookies).map(([name, value]) => ({
        name,
        value,
        domain
      })));
    }

    await this.page.setRequestInterception(true);
    this.page.on('request', (request: Request) => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  async crawl(url: string): Promise<CrawlerResponse> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      let retries = this.options.retries || 3;
      while (retries > 0) {
        try {
          await this.page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: this.options.timeout || 30000
          });

          await this.waitForPageLoad();
          const content = await this.extractPageContent();

          if (await this.validateResponse(content)) {
            return {
              success: true,
              data: content,
              timestamp: new Date().toISOString()
            };
          }
          
          throw new Error('Invalid response');
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      throw new Error('Max retries exceeded');
    } catch (error) {
      return this.handleError(error as Error);
    }
  }

  private async waitForPageLoad(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.page.waitForFunction(() => {
        return document.readyState === 'complete';
      });

      await this.page.waitForNetworkIdle({
        timeout: this.options.timeout || 30000,
        idleTime: 500
      });
    } catch (error) {
      throw new Error(`Failed to wait for page load: ${error}`);
    }
  }

  private async extractPageContent(): Promise<any> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      return await this.page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          html: document.documentElement.outerHTML,
          metadata: {
            description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
            keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')
          }
        };
      });
    } catch (error) {
      throw new Error(`Failed to extract page content: ${error}`);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      throw new Error(`Failed to close PuppeteerCrawler: ${error}`);
    }
  }

  async getPage(): Promise<Page> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    return this.page;
  }
}
