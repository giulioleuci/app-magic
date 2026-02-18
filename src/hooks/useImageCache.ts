"use client";

import { useEffect, useState } from 'react';

const DB_NAME = 'ProxyForgeImageCache';
const STORE_NAME = 'images';
const DB_VERSION = 1;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageCacheDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        }
      };
    });
  }

  async get(url: string): Promise<string | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cached = request.result as CachedImage | undefined;

        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is expired
        const now = Date.now();
        if (now - cached.timestamp > CACHE_DURATION) {
          this.delete(url); // Clean up expired cache
          resolve(null);
          return;
        }

        // Convert blob to object URL
        const objectUrl = URL.createObjectURL(cached.blob);
        resolve(objectUrl);
      };
    });
  }

  async set(url: string, blob: Blob): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const cached: CachedImage = {
        url,
        blob,
        timestamp: Date.now(),
      };

      const request = store.put(cached);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(url: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

const cacheDB = new ImageCacheDB();

export const useImageCache = (url: string | undefined, enabled: boolean = true) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    if (!enabled) {
      return;
    }

    let mounted = true;

    const loadImage = async () => {
      try {
        // Try to get from cache first
        const cached = await cacheDB.get(url);

        if (cached && mounted) {
          setCachedUrl(cached);
          setIsLoading(false);
          return;
        }

        // If not in cache, fetch and cache it
        const response = await fetch(url);
        const blob = await response.blob();

        // Cache the blob
        await cacheDB.set(url, blob);

        // Create object URL for display
        const objectUrl = URL.createObjectURL(blob);

        if (mounted) {
          setCachedUrl(objectUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error caching image:', error);
        if (mounted) {
          // Fall back to original URL on error
          setCachedUrl(url);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
      // Clean up object URL when component unmounts
      if (cachedUrl && cachedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cachedUrl);
      }
    };
  }, [url, enabled]);

  return { cachedUrl: cachedUrl || url, isLoading };
};

export const clearImageCache = async () => {
  await cacheDB.clear();
};
