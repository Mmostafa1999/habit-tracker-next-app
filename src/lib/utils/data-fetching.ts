// Centralized data fetching with caching
import { cache } from "react";

interface FetchOptions {
  cache?: RequestCache;
  next?: { revalidate?: number };
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
}

export const fetchData = cache(
  async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
    const defaultOptions: FetchOptions = {
      cache: "force-cache", // Default to static caching
      next: { revalidate: 3600 }, // Revalidate every hour by default
    };

    const mergedOptions = { ...defaultOptions, ...options };

    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}`);
    }

    return response.json();
  },
);

// Helper for Firebase data fetching with client-side cache
export const createFirebaseFetcher = <T>(
  fetchFunction: (...args: string[]) => Promise<T>,
) => {
  // Create a Map to store cached results
  const cache = new Map<string, { data: T; timestamp: number }>();

  return async (...args: string[]): Promise<T> => {
    // Create a cache key from the arguments
    const cacheKey = JSON.stringify(args);

    // Check cache first (cache for 6 minutes)
    const cachedResult = cache.get(cacheKey);
    const now = Date.now();

    if (cachedResult && now - cachedResult.timestamp < 6 * 60 * 1000) {
      return cachedResult.data;
    }

    // If not cached or expired, fetch new data
    try {
      const data = await fetchFunction(...args);

      // Store in cache
      cache.set(cacheKey, { data, timestamp: now });

      return data;
    } catch (error) {
      // Log error and rethrow
      console.error("Error fetching data:", error);
      throw error;
    }
  };
};
