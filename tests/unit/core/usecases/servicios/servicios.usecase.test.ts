import { ServiciosUseCase } from '@core/usecases/servicios/servicios.usecase';
import { IServicioRepository } from '@core/ports/out/servicios/IServicioRepository';
import { ICategoriaServicioRepository } from '@core/ports/out/categoria-servicio/ICategoriaServicioRepository';
import { IStoragePort, ArchivoInput, ImagenSubida } from '@core/ports/out/storage/IStoragePort';
import { Servicio } from '@core/domain/servicio/servicio.entity';
import { CategoriaServicio } from '@core/domain/categoria-servicio/categoriaServicio.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

const categoriaFake: CategoriaServicio = {
    id: 1,
    nombre: 'Cortes',
    descripcion: null,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const servicioFake: Servicio = {
    id: 1,
    nombre: 'Corte de cabello',
    descripcion: null,
    duracionMinutos: 30,
    idCategoria: 1,
    imagenUrl: null,
    idImagen: null,
    nombreImagen: null,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const servicioConImagenFake: Servicio = {
    ...servicioFake,
    imagenUrl: 'https://res.cloudinary.com/fadeforge/image/upload/v1/fadeforge/servicios/abc123',
    idImagen: 'fadeforge/servicios/abc123',
    nombreImagen: 'corte.jpg',
};

const archivoFake: ArchivoInput = {
    buffer: Buffer.from('fake-image'),
    nombreOriginal: 'corte.jpg',
};

const imagenSubidaFake: ImagenSubida = {
    url: 'https://res.cloudinary.com/fadeforge/image/upload/v1/fadeforge/servicios/abc123',
    publicId: 'fadeforge/servicios/abc123',
    nombre: 'corte.jpg',
};

const mockServicioRepo: jest.Mocked<IServicioRepository> = {
    listarTodos: jest.fn(),
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorNombre: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
    buscarPrecioActual: jest.fn(),
    buscarPorIds: jest.fn(),
    buscarPreciosActuales: jest.fn(),
};

const mockCategoriaRepo: jest.Mocked<ICategoriaServicioRepository> = {
    listarTodos: jest.fn(),
    listarActivos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorNombre: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
};

const mockStoragePort: jest.Mocked<IStoragePort> = {
    subir: jest.fn(),
    eliminar: jest.fn(),
};

describe('ServiciosUseCase', () => {

    let useCase: ServiciosUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ServiciosUseCase(mockServicioRepo, mockCategoriaRepo, mockStoragePort);
    });

    describe('listar', () => {

        it('debe retornar todos los servicios', async () => {
            mockServicioRepo.listarTodos.mockResolvedValue([servicioFake]);

            const result = await useCase.listar();

            expect(result).toEqual([servicioFake]);
        });
    });

    describe('listarActivos', () => {

        it('debe retornar solo los servicios activos', async () => {
            mockServicioRepo.listarActivos.mockResolvedValue([servicioFake]);

            const result = await useCase.listarActivos();

            expect(result).toEqual([servicioFake]);
        });
    });

    describe('obtenerPorId', () => {

        it('debe retornar el servicio si existe', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);

            const result = await useCase.obtenerPorId(1);

            expect(result).toEqual(servicioFake);
        });

        it('debe lanzar NotFoundError si el servicio no existe', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.obtenerPorId(99)).rejects.toThrow(NotFoundError);
        });
    });

    describe('crear', () => {

        it('debe lanzar NotFoundError si la categoría no existe', async () => {
            mockCategoriaRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.crear({ nombre: 'Corte de cabello', duracionMinutos: 30, idCategoria: 99 }))
                .rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si la categoría está desactivada', async () => {
            mockCategoriaRepo.buscarPorId.mockResolvedValue({ ...categoriaFake, activo: false });

            await expect(useCase.crear({ nombre: 'Corte de cabello', duracionMinutos: 30, idCategoria: 1 }))
                .rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si el nombre ya existe', async () => {
            mockCategoriaRepo.buscarPorId.mockResolvedValue(categoriaFake);
            mockServicioRepo.buscarPorNombre.mockResolvedValue(servicioFake);

            await expect(useCase.crear({ nombre: 'Corte de cabello', duracionMinutos: 30, idCategoria: 1 }))
                .rejects.toThrow(ConflictError);
        });

        it('debe crear el servicio sin imagen si no se provee archivo', async () => {
            mockCategoriaRepo.buscarPorId.mockResolvedValue(categoriaFake);
            mockServicioRepo.buscarPorNombre.mockResolvedValue(null);
            mockServicioRepo.crear.mockResolvedValue(servicioFake);

            const result = await useCase.crear({ nombre: 'Corte de cabello', duracionMinutos: 30, idCategoria: 1 });

            expect(mockStoragePort.subir).not.toHaveBeenCalled();
            expect(mockServicioRepo.crear).toHaveBeenCalledTimes(1);
            expect(result).toEqual(servicioFake);
        });

        it('debe subir la imagen y asignarla al servicio si se provee archivo', async () => {
            mockCategoriaRepo.buscarPorId.mockResolvedValue(categoriaFake);
            mockServicioRepo.buscarPorNombre.mockResolvedValue(null);
            mockStoragePort.subir.mockResolvedValue(imagenSubidaFake);
            mockServicioRepo.crear.mockResolvedValue(servicioConImagenFake);

            const result = await useCase.crear(
                { nombre: 'Corte de cabello', duracionMinutos: 30, idCategoria: 1 },
                archivoFake
            );

            expect(mockStoragePort.subir).toHaveBeenCalledWith(archivoFake);
            expect(mockServicioRepo.crear).toHaveBeenCalledWith(
                expect.objectContaining({
                    imagenUrl: imagenSubidaFake.url,
                    idImagen: imagenSubidaFake.publicId,
                    nombreImagen: imagenSubidaFake.nombre,
                })
            );
            expect(result).toEqual(servicioConImagenFake);
        });
    });

    describe('actualizar', () => {

        it('debe lanzar NotFoundError si el servicio no existe', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(99, { nombre: 'Nuevo' })).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el servicio está desactivado', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue({ ...servicioFake, activo: false });

            await expect(useCase.actualizar(1, { nombre: 'Nuevo' })).rejects.toThrow(ConflictError);
            expect(mockCategoriaRepo.buscarPorId).not.toHaveBeenCalled();
            expect(mockServicioRepo.buscarPorNombre).not.toHaveBeenCalled();
        });

        it('debe lanzar NotFoundError si la categoría nueva no existe', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            mockCategoriaRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(1, { idCategoria: 99 })).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si la categoría nueva está desactivada', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            mockCategoriaRepo.buscarPorId.mockResolvedValue({ ...categoriaFake, activo: false });

            await expect(useCase.actualizar(1, { idCategoria: 1 })).rejects.toThrow(ConflictError);
        });

        it('debe lanzar ConflictError si el nombre ya lo usa otro servicio', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            mockServicioRepo.buscarPorNombre.mockResolvedValue({ ...servicioFake, id: 2 });

            await expect(useCase.actualizar(1, { nombre: 'Corte de cabello' })).rejects.toThrow(ConflictError);
        });

        it('debe actualizar sin imagen si no se provee archivo', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            mockServicioRepo.buscarPorNombre.mockResolvedValue(null);
            mockServicioRepo.actualizar.mockResolvedValue({ ...servicioFake, nombre: 'Corte clásico' });

            const result = await useCase.actualizar(1, { nombre: 'Corte clásico' });

            expect(mockStoragePort.subir).not.toHaveBeenCalled();
            expect(mockStoragePort.eliminar).not.toHaveBeenCalled();
            expect(mockServicioRepo.actualizar).toHaveBeenCalledWith(1, { nombre: 'Corte clásico' });
            expect(result.nombre).toBe('Corte clásico');
        });

        it('debe subir imagen sin eliminar si el servicio no tenía imagen previa', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake); // idImagen: null
            mockServicioRepo.buscarPorNombre.mockResolvedValue(null);
            mockStoragePort.subir.mockResolvedValue(imagenSubidaFake);
            mockServicioRepo.actualizar.mockResolvedValue(servicioConImagenFake);

            await useCase.actualizar(1, { nombre: 'Corte clásico' }, archivoFake);

            expect(mockStoragePort.eliminar).not.toHaveBeenCalled();
            expect(mockStoragePort.subir).toHaveBeenCalledWith(archivoFake);
        });

        it('debe eliminar la imagen anterior y subir la nueva si el servicio ya tenía imagen', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioConImagenFake);
            mockServicioRepo.buscarPorNombre.mockResolvedValue(null);
            mockStoragePort.subir.mockResolvedValue(imagenSubidaFake);
            mockServicioRepo.actualizar.mockResolvedValue(servicioConImagenFake);

            await useCase.actualizar(1, { nombre: 'Corte clásico' }, archivoFake);

            expect(mockStoragePort.eliminar).toHaveBeenCalledWith(servicioConImagenFake.idImagen);
            expect(mockStoragePort.subir).toHaveBeenCalledWith(archivoFake);
        });
    });

    describe('desactivar', () => {

        it('debe lanzar NotFoundError si el servicio no existe', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.desactivar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el servicio ya está desactivado', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue({ ...servicioFake, activo: false });

            await expect(useCase.desactivar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar desactivar cuando el servicio existe y está activo', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            mockServicioRepo.desactivar.mockResolvedValue();

            await useCase.desactivar(1);

            expect(mockServicioRepo.desactivar).toHaveBeenCalledWith(1);
        });
    });

    describe('reactivar', () => {

        it('debe lanzar NotFoundError si el servicio no existe', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(null);
            await expect(useCase.reactivar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el servicio ya está activo', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue(servicioFake);
            await expect(useCase.reactivar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar reactivar cuando el servicio existe y está inactivo', async () => {
            mockServicioRepo.buscarPorId.mockResolvedValue({ ...servicioFake, activo: false });
            mockServicioRepo.reactivar.mockResolvedValue();
            await useCase.reactivar(1);
            expect(mockServicioRepo.reactivar).toHaveBeenCalledWith(1);
        });
    });
});
