import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function limitConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const itemQueue = items.map((item, index) => ({ item, index }));

  const worker = async () => {
    while (itemQueue.length > 0) {
      const { item, index } = itemQueue.shift()!;
      results[index] = await fn(item);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  return Promise.all(workers).then(() => results);
}
