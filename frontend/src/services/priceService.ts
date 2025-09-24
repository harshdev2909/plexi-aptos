// Price service to fetch real APT price data
export interface PriceData {
  price: number;
  symbol: string;
  change24h: number;
}

export class PriceService {
  private static instance: PriceService;
  private cache: Map<string, { data: PriceData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  async getAptPrice(): Promise<PriceData> {
    const cacheKey = 'apt_price';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Try CoinGecko API first
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=aptos&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (response.ok) {
        const data = await response.json();
        const priceData: PriceData = {
          price: data.aptos.usd,
          symbol: 'APT',
          change24h: data.aptos.usd_24h_change || 0
        };
        
        this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
        return priceData;
      }
    } catch (error) {
      console.warn('CoinGecko API failed, trying fallback:', error);
    }

    try {
      // Fallback to CoinCap API
      const response = await fetch('https://api.coincap.io/v2/assets/aptos');
      
      if (response.ok) {
        const data = await response.json();
        const priceData: PriceData = {
          price: parseFloat(data.data.priceUsd),
          symbol: 'APT',
          change24h: parseFloat(data.data.changePercent24Hr) || 0
        };
        
        this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
        return priceData;
      }
    } catch (error) {
      console.warn('CoinCap API failed, using default price:', error);
    }

    // Fallback to default price if all APIs fail
    const defaultPrice: PriceData = {
      price: 8.50, // Approximate APT price
      symbol: 'APT',
      change24h: 0
    };
    
    this.cache.set(cacheKey, { data: defaultPrice, timestamp: Date.now() });
    return defaultPrice;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  formatAptAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  }
}

export const priceService = PriceService.getInstance();
