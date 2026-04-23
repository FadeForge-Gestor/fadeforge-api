import { UsuariosUseCase } from '@core/usecases/usuarios/usuarios.usecase';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { Usuario, CrearUsuarioInput } from '@core/domain/usuario/usuario.entity';
import { NotFoundError, ConflictError } from '@shared/errors/HttpError';

const usuarioFake: Usuario = {
    id: 1,
    nombre: 'Juan',
    aPaterno: 'Pérez',
    aMaterno: null,
    telefono: '1234567890',
    idRol: 2,
    activo: true,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const inputCrear: CrearUsuarioInput = {
    nombre: 'Juan',
    aPaterno: 'Pérez',
    telefono: '1234567890',
    idRol: 2,
    correo: 'juan@test.com',
    contrasena: 'secreto123',
};

const mockRepo: jest.Mocked<IUsuarioRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCorreo: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
};

describe('UsuariosUseCase', () => {

    let useCase: UsuariosUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new UsuariosUseCase(mockRepo);
    });

    describe('obtenerPorId', () => {

        it('debe retornar el usuario si existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(usuarioFake);

            const result = await useCase.obtenerPorId(1);

            expect(result).toEqual(usuarioFake);
        });

        it('debe lanzar NotFoundError si el usuario no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.obtenerPorId(99)).rejects.toThrow(NotFoundError);
        });
    });

    describe('crear', () => {

        it('debe lanzar ConflictError si el correo ya está registrado', async () => {
            mockRepo.buscarPorCorreo.mockResolvedValue(usuarioFake);

            await expect(useCase.crear(inputCrear)).rejects.toThrow(ConflictError);
        });

        it('debe crear el usuario si el correo no existe', async () => {
            mockRepo.buscarPorCorreo.mockResolvedValue(null);
            mockRepo.crear.mockResolvedValue(usuarioFake);

            const result = await useCase.crear(inputCrear);

            expect(mockRepo.crear).toHaveBeenCalledWith(inputCrear);
            expect(result).toEqual(usuarioFake);
        });
    });

    describe('actualizar', () => {

        it('debe lanzar NotFoundError si el usuario no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(99, { nombre: 'Otro' })).rejects.toThrow(NotFoundError);
        });

        it('debe actualizar cuando el usuario existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockRepo.actualizar.mockResolvedValue({ ...usuarioFake, nombre: 'Otro' });

            const result = await useCase.actualizar(1, { nombre: 'Otro' });

            expect(mockRepo.actualizar).toHaveBeenCalledWith(1, { nombre: 'Otro' });
            expect(result.nombre).toBe('Otro');
        });
    });

    describe('desactivar', () => {

        it('debe lanzar NotFoundError si el usuario no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.desactivar(99)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el usuario ya está desactivado', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...usuarioFake, activo: false });

            await expect(useCase.desactivar(1)).rejects.toThrow(ConflictError);
        });

        it('debe llamar desactivar cuando el usuario existe y está activo', async () => {
            mockRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockRepo.desactivar.mockResolvedValue();

            await useCase.desactivar(1);

            expect(mockRepo.desactivar).toHaveBeenCalledWith(1);
        });
    });
});
