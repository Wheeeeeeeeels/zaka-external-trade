import { ProxyConfig, CrawlerOptions, CrawlerResponse } from '../types';

export abstract class BaseCrawler {
  protected options: CrawlerOptions;
  protected proxy?: ProxyConfig;

  constructor(options: CrawlerOptions) {
    this.options = options;
    this.proxy = options.proxy;
  }

  abstract initialize(): Promise<void>;
  abstract crawl(url: string): Promise<CrawlerResponse>;
  abstract close(): Promise<void>;

  protected async handleError(error: Error): Promise<CrawlerResponse> {
    console.error(`Crawler error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  protected async validateResponse(response: any): Promise<boolean> {
    return true;
  }
}