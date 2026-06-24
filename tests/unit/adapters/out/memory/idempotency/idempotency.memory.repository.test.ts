import { IdempotencyMemoryRepository } from '@adapters/out/memory/idempotency/idempotency.memory.repository';
import { StoredResponse } from '@core/ports/out/idempotency/IIdempotencyRepository';

describe('IdempotencyMemoryRepository', () => {
    let repo: IdempotencyMemoryRepository;
    const response: StoredResponse = { status: 201, body: { ok: true, id: 1 } };

    beforeEach(() => {
        repo = new IdempotencyMemoryRepository();
    });

    describe('get', () => {
        it('debe retornar null cuando la key no existe', async () => {
            const result = await repo.get('key-inexistente');
            expect(result).toBeNull();
        });

        it('debe retornar la respuesta guardada cuando la key existe', async () => {
            await repo.save('key-1', response);
            const result = await repo.get('key-1');
            expect(result).toEqual(response);
        });

        it('debe retornar null y eliminar la entry cuando el TTL expiró', async () => {
            const dateSpy = jest.spyOn(Date, 'now');
            dateSpy.mockReturnValue(1000);
            await repo.save('key-expirada', response, 500);

            dateSpy.mockReturnValue(1501);
            const result = await repo.get('key-expirada');
            expect(result).toBeNull();

            dateSpy.mockRestore();
        });

        it('debe retornar la respuesta si el TTL aún no expiró', async () => {
            const dateSpy = jest.spyOn(Date, 'now');
            dateSpy.mockReturnValue(1000);
            await repo.save('key-vigente', response, 500);

            dateSpy.mockReturnValue(1499);
            const result = await repo.get('key-vigente');
            expect(result).toEqual(response);

            dateSpy.mockRestore();
        });
    });

    describe('save', () => {
        it('debe guardar la respuesta con TTL por defecto', async () => {
            await repo.save('key-default', response);
            const result = await repo.get('key-default');
            expect(result).toEqual(response);
        });

        it('debe sobrescribir una entry existente con la misma key', async () => {
            const nuevaRespuesta: StoredResponse = { status: 200, body: { ok: true, id: 2 } };
            await repo.save('key-dup', response);
            await repo.save('key-dup', nuevaRespuesta);
            const result = await repo.get('key-dup');
            expect(result).toEqual(nuevaRespuesta);
        });
    });
});
