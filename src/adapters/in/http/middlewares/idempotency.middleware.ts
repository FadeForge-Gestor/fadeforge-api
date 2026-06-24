import { Request, Response, NextFunction } from 'express';
import { IIdempotencyRepository } from '@core/ports/out/idempotency/IIdempotencyRepository';

export const idempotency = (repo: IIdempotencyRepository) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.headers['idempotency-key'] as string | undefined;

    if (!key) {
      next();
      return;
    }

    const cached = await repo.get(key);
    if (cached) {
      res.status(cached.status).json(cached.body);
      return;
    }

    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
      repo.save(key, { status: res.statusCode, body });
      return originalJson(body);
    };

    next();
  };
