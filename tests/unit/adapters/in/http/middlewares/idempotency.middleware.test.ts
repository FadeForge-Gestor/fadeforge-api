import { Request, Response, NextFunction } from 'express';
import { idempotency } from '@middlewares/idempotency.middleware';
import { IdempotencyMemoryRepository } from '@adapters/out/memory/idempotency/idempotency.memory.repository';

describe('idempotency middleware', () => {
    let repo: IdempotencyMemoryRepository;
    let next: jest.MockedFunction<NextFunction>;
    let res: { status: jest.Mock; json: jest.Mock; statusCode: number };

    beforeEach(() => {
        repo = new IdempotencyMemoryRepository();
        next = jest.fn();
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            statusCode: 201,
        };
    });

    it('debe llamar next() cuando no hay header idempotency-key', async () => {
        const req = { headers: {} } as Request;

        await idempotency(repo)(req, res as unknown as Response, next);

        expect(next).toHaveBeenCalledWith();
        expect(res.json).not.toHaveBeenCalled();
    });

    it('debe retornar la respuesta cacheada cuando la key ya existe', async () => {
        const key = 'uuid-ya-procesada';
        await repo.save(key, { status: 201, body: { ok: true, id: 42 } });

        const req = { headers: { 'idempotency-key': key } } as unknown as Request;

        await idempotency(repo)(req, res as unknown as Response, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ ok: true, id: 42 });
        expect(next).not.toHaveBeenCalled();
    });

    it('debe llamar next() cuando la key es nueva', async () => {
        const req = { headers: { 'idempotency-key': 'uuid-nueva' } } as unknown as Request;

        await idempotency(repo)(req, res as unknown as Response, next);

        expect(next).toHaveBeenCalledWith();
    });

    it('debe guardar la respuesta en el repo cuando res.json es invocado', async () => {
        const key = 'uuid-para-guardar';
        const req = { headers: { 'idempotency-key': key } } as unknown as Request;

        await idempotency(repo)(req, res as unknown as Response, next);

        res.json({ ok: true, id: 99 });

        const guardada = await repo.get(key);
        expect(guardada).toEqual({ status: 201, body: { ok: true, id: 99 } });
    });

    it('debe invocar el json original al interceptar', async () => {
        const originalJson = jest.fn();
        res.json = originalJson;

        const key = 'uuid-intercept';
        const req = { headers: { 'idempotency-key': key } } as unknown as Request;

        await idempotency(repo)(req, res as unknown as Response, next);

        res.json({ ok: true });

        expect(originalJson).toHaveBeenCalledWith({ ok: true });
    });
});
