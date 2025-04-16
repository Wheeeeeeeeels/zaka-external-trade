export interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
  }
  
  export interface CrawlerOptions {
    proxy?: ProxyConfig;
    timeout?: number;
    retries?: number;
    userAgent?: string;
    cookies?: Record<string, string>;
    baseUrl?: string;
  }
  
  export interface PlatformConfig {
    name: string;
    baseUrl: string;
    apiEndpoints: Record<string, string>;
    headers?: Record<string, string>;
    proxy?: ProxyConfig;
  }
  
  export interface ProductInfo {
    id: string;
    title: string;
    price: number;
    description?: string;
    images: string[];
    specifications: Record<string, any>;
    seller: Record<string, any>;
    platform: string;
    url: string;
    timestamp: string;
  }

  export interface CrawlerResponse {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: string;
  }

  export interface RawProduct {
    id?: string;
    title?: string;
    price?: string | number;
    description?: string;
    images?: string[];
    specifications?: Record<string, string>;
    seller?: Record<string, any>;
    url?: string;
  }