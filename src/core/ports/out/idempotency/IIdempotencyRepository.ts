export interface StoredResponse {
  status: number;
  body: unknown;
}

export interface IIdempotencyRepository {
  get(key: string): Promise<StoredResponse | null>;
  save(key: string, response: StoredResponse, ttlMs?: number): Promise<void>;
}
