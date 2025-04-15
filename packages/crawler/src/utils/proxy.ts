import { ProxyConfig } from '../types';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class ProxyPool {
  private proxies: ProxyConfig[] = [];
  private currentIndex: number = 0;

  constructor(proxies: ProxyConfig[] = []) {
    this.proxies = proxies;
  }

  addProxy(proxy: ProxyConfig): void {
    this.proxies.push(proxy);
  }

  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) return null;
    
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  removeProxy(proxy: ProxyConfig): void {
    this.proxies = this.proxies.filter(p => 
      p.host !== proxy.host || p.port !== proxy.port
    );
    if (this.currentIndex >= this.proxies.length) {
      this.currentIndex = 0;
    }
  }

  async testProxy(proxy: ProxyConfig): Promise<boolean> {
    try {
      const agent = new HttpsProxyAgent(`http://${proxy.host}:${proxy.port}`);
      const response = await fetch('https://api.ipify.org?format=json', {
        agent,
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  getProxyCount(): number {
    return this.proxies.length;
  }

  addProxies(proxies: ProxyConfig[]): void {
    this.proxies.push(...proxies);
  }

  clearProxies(): void {
    this.proxies = [];
    this.currentIndex = 0;
  }
}
