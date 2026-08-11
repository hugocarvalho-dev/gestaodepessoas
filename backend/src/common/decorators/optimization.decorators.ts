import { Injectable } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limiting decorator - use em endpoints sensíveis
 * @Throttle(3, 60) = máximo 3 requisições a cada 60 segundos
 */
export { Throttle, ThrottlerGuard };

/**
 * Cache decorator simples para métodos (TTL em segundos)
 */
const cacheMap = new Map<string, { data: any; expiry: number }>();

export function CacheKey(ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
      const cached = cacheMap.get(cacheKey);

      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }

      const result = await originalMethod.apply(this, args);
      cacheMap.set(cacheKey, {
        data: result,
        expiry: Date.now() + ttl * 1000,
      });

      return result;
    };

    return descriptor;
  };
}

/**
 * Full-text search simples
 */
export function searchText(data: any[], query: string, fields: string[]): any[] {
  if (!query) return data;

  const lowerQuery = query.toLowerCase();
  return data.filter(item =>
    fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(lowerQuery);
    }),
  );
}

/**
 * Paginação cursor-based
 */
export interface CursorPaginationParams {
  cursor?: string; // base64 encoded: { id, sort_value }
  limit: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export function decodeCursor(cursor?: string): { id: string; value: any } | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  } catch {
    return null;
  }
}

export function encodeCursor(id: string, value: any): string {
  return Buffer.from(JSON.stringify({ id, value })).toString('base64');
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasBefore: boolean;
  hasNext: boolean;
}
