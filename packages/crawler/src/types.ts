export interface CrawlerResponse {
  success: boolean;
  data?: string;
  error?: string;
  timestamp: string;
}

export interface PlatformConfig {
  name: string;
  baseUrl: string;
  apiEndpoints: {
    search: string;
    product: string;
    category: string;
  };
  proxy?: ProxyConfig;
}

export interface ProductInfo {
  id: string;
  title: string;
  price: number;
  images: string[];
  url: string;
  specifications: Record<string, any>;
  seller: Record<string, any>;
  description: string;
  platform: string;
  timestamp: string;
}

export interface RawProduct {
  id: string;
  title: string;
  price: string | number;
  images: string[];
  url: string;
  specifications?: Record<string, any>;
  seller?: Record<string, any>;
  description?: string;
}

export interface CrawlerOptions {
  baseUrl: string;
  userAgent?: string;
  timeout?: number;
  proxy?: ProxyConfig;
  storage?: StorageConfig;
  headers?: Record<string, string>;
  retries?: number;
}

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface StorageConfig {
  uri: string;
  options?: Record<string, any>;
} 