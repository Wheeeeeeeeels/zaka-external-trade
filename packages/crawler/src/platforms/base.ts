import { PlatformConfig, ProductInfo } from '../types';

export abstract class BasePlatform {
  protected config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract getProductList(params: any): Promise<ProductInfo[]>;
  abstract getProductDetail(id: string): Promise<ProductInfo>;
  abstract searchProducts(keyword: string): Promise<ProductInfo[]>;
  abstract close(): Promise<void>;

  protected async normalize(data: any): Promise<ProductInfo> {
    // 数据标准化处理
    return {
      id: data.id,
      title: data.title,
      price: this.normalizePrice(data.price),
      description: data.description,
      images: this.normalizeImages(data.images),
      specifications: this.normalizeSpecs(data.specifications),
      seller: this.normalizeSeller(data.seller),
      platform: this.config.name,
      url: data.url,
      timestamp: new Date().toISOString()
    };
  }

  private normalizePrice(price: any): number {
    // 价格标准化
    return typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price;
  }

  private normalizeImages(images: any): string[] {
    // 图片URL标准化
    return Array.isArray(images) ? images.filter(img => typeof img === 'string') : [];
  }

  private normalizeSpecs(specs: any): Record<string, any> {
    // 规格标准化
    return specs && typeof specs === 'object' ? specs : {};
  }

  private normalizeSeller(seller: any): Record<string, any> {
    // 卖家信息标准化
    return seller && typeof seller === 'object' ? seller : {};
  }
}