interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTtl = 5 * 60 * 1000; // 5 minutes default
  private maxSize = 100;

  constructor() {
    // Load cache from localStorage on initialization
    this.loadFromLocalStorage();

    // Clean up expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('plexi_api_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();

        // Only load non-expired entries
        Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
          if (entry.expiresAt > now) {
            this.cache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load API cache from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      const cacheObject = Object.fromEntries(this.cache.entries());
      localStorage.setItem('plexi_api_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save API cache to localStorage:', error);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt <= now) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.cache.delete(key));

    // Enforce max size by removing oldest entries
    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, entries.length - this.maxSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    this.saveToLocalStorage();
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      this.saveToLocalStorage();
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, config?: CacheConfig): void {
    const ttl = config?.ttl || this.defaultTtl;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };

    this.cache.set(key, entry);
    this.saveToLocalStorage();
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.saveToLocalStorage();
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem('plexi_api_cache');
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      this.saveToLocalStorage();
      return false;
    }

    return true;
  }

  // Get cache stats for debugging
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Cache configurations for different endpoints
export const CACHE_CONFIGS = {
  // Market data changes frequently
  MARKET_DATA: { ttl: 30 * 1000 }, // 30 seconds

  // Price data changes frequently
  PRICE_DATA: { ttl: 60 * 1000 }, // 1 minute

  // Vault state changes less frequently
  VAULT_STATE: { ttl: 2 * 60 * 1000 }, // 2 minutes

  // User position changes less frequently
  USER_POSITION: { ttl: 2 * 60 * 1000 }, // 2 minutes

  // Order book changes frequently
  ORDERBOOK: { ttl: 15 * 1000 }, // 15 seconds

  // Trading positions change less frequently
  POSITIONS: { ttl: 1 * 60 * 1000 }, // 1 minute

  // Trades history changes less frequently
  TRADES: { ttl: 5 * 60 * 1000 }, // 5 minutes

  // Events change less frequently
  EVENTS: { ttl: 3 * 60 * 1000 }, // 3 minutes
} as const;

// Create singleton instance
export const apiCache = new ApiCache();

// Helper function to create cache keys
export const createCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  if (!params) return endpoint;

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return `${endpoint}?${sortedParams}`;
};