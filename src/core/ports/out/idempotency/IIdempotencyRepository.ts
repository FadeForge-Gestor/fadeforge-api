import { StoredResponse } from '@core/domain/idempotency/idempotency.entity';

export interface IIdempotencyRepository {
    get(key: string): Promise<StoredResponse | null>;
    save(key: string, response: StoredResponse, ttlMs?: number): Promise<void>;
}
