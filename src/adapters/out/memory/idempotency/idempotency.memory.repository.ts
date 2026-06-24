import { IIdempotencyRepository, StoredResponse } from '@core/ports/out/idempotency/IIdempotencyRepository';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  response: StoredResponse;
  expiresAt: number;
}

export class IdempotencyMemoryRepository implements IIdempotencyRepository {
  private readonly store = new Map<string, CacheEntry>();

  async get(key: string): Promise<StoredResponse | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.response;
  }

  async save(key: string, response: StoredResponse, ttlMs = DEFAULT_TTL_MS): Promise<void> {
    this.store.set(key, {
      response,
      expiresAt: Date.now() + ttlMs,
    });
  }
}
