/**
 * Cache Service
 * Provides caching for API responses with Redis (primary) and SQLite (fallback)
 */

import Database from 'better-sqlite3';
import { CACHE_TTL } from '../utils/constants';

// ============================================
// CACHE INTERFACE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ============================================
// SQLITE CACHE IMPLEMENTATION
// ============================================

class SQLiteCache {
  private db: Database.Database;
  private readonly tableName = 'cache';

  constructor() {
    // Initialize SQLite database
    this.db = new Database(':memory:'); // Use in-memory for simplicity
    this.createTable();
  }

  private createTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        ttl INTEGER NOT NULL
      )
    `);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const stmt = this.db.prepare(
        `SELECT value, timestamp, ttl FROM ${this.tableName} WHERE key = ?`
      );
      const row = stmt.get(key) as { value: string; timestamp: number; ttl: number } | undefined;

      if (!row) return null;

      // Check if expired
      const now = Date.now();
      if (now - row.timestamp > row.ttl * 1000) {
        // Entry expired, delete it
        this.delete(key);
        return null;
      }

      return JSON.parse(row.value) as T;
    } catch (error) {
      console.error('SQLite cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = CACHE_TTL.analysis): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO ${this.tableName} (key, value, timestamp, ttl)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(key, JSON.stringify(value), Date.now(), ttlSeconds);
    } catch (error) {
      console.error('SQLite cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE key = ?`);
      stmt.run(key);
    } catch (error) {
      console.error('SQLite cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.db.exec(`DELETE FROM ${this.tableName}`);
    } catch (error) {
      console.error('SQLite cache clear error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const now = Date.now();
      const stmt = this.db.prepare(
        `DELETE FROM ${this.tableName} WHERE (? - timestamp) / 1000 > ttl`
      );
      stmt.run(now);
    } catch (error) {
      console.error('SQLite cache cleanup error:', error);
    }
  }
}

// ============================================
// CACHE MANAGER
// ============================================

class CacheManager {
  private cache: SQLiteCache;
  private static instance: CacheManager;

  private constructor() {
    this.cache = new SQLiteCache();
    // Periodic cleanup every 15 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cache.cleanup(), 15 * 60 * 1000);
    }
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached value or execute fetch function
   * Implements cache-aside pattern
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = CACHE_TTL.analysis
  ): Promise<{ data: T; cached: boolean }> {
    // Try to get from cache first
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      console.log(`Cache hit: ${key}`);
      return { data: cached, cached: true };
    }

    // Cache miss - fetch fresh data
    console.log(`Cache miss: ${key}`);
    const data = await fetchFn();
    
    // Store in cache
    await this.cache.set(key, data, ttlSeconds);
    
    return { data, cached: false };
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.cache.set(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    return this.cache.clear();
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Export cache key generators for consistency
export const cacheKeys = {
  quote: (symbol: string) => `quote:${symbol.toUpperCase()}`,
  financials: (symbol: string) => `financials:${symbol.toUpperCase()}`,
  analysis: (symbol: string) => `analysis:${symbol.toUpperCase()}`,
  technicals: (symbol: string) => `technicals:${symbol.toUpperCase()}`,
};
