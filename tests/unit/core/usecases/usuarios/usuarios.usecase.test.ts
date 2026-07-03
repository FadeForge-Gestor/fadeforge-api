import { UsuariosUseCase } from '@core/usecases/usuarios/usuarios.usecase';
import { IUsuarioRepository } from '@core/ports/out/usuarios/IUsuarioRepository';
import { IRolRepository } from '@core/ports/out/roles/IRolRepository';
import { Usuario, CrearUsuarioInput } from '@core/domain/usuario/usuario.entity';
import { Rol } from '@core/domain/rol/rol.entity';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '@shared/errors/HttpError';

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));

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

const rolFake: Rol = {
    id: 2,
    clave: 'CLIENTE',
    nombre: 'Cliente',
    descripcion: null,
    fechaCreacion: new Date(),
    fechaModificacion: new Date(),
};

const inputCrear: CrearUsuarioInput = {
    nombre: 'Juan',
    aPaterno: 'Pérez',
    telefono: '1234567890',
    idRol: 2,
    correo: 'juan@test.com',
    contrasena: 'Secreto123!',
};

const mockRepo: jest.Mocked<IUsuarioRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCorreo: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    desactivar: jest.fn(),
    reactivar: jest.fn(),
};

const mockRolRepo: jest.Mocked<IRolRepository> = {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorClave: jest.fn(),
};

const ACTOR_ID = 99;

describe('UsuariosUseCase', () => {

    let useCase: UsuariosUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new UsuariosUseCase(mockRepo, mockRolRepo);
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

        it('debe lanzar BadRequestError si la contraseña no cumple los requisitos', async () => {
            await expect(useCase.crear({ ...inputCrear, contrasena: 'debil' }))
                .rejects.toThrow(BadRequestError);
        });

        it('debe lanzar ConflictError si el correo ya está registrado', async () => {
            mockRepo.buscarPorCorreo.mockResolvedValue(usuarioFake);

            await expect(useCase.crear(inputCrear)).rejects.toThrow(ConflictError);
        });

        it('debe lanzar BadRequestError si el rol no existe', async () => {
            mockRepo.buscarPorCorreo.mockResolvedValue(null);
            mockRolRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.crear(inputCrear)).rejects.toThrow(BadRequestError);
        });

        it('debe crear el usuario si el correo no existe y el rol es válido', async () => {
            mockRepo.buscarPorCorreo.mockResolvedValue(null);
            mockRolRepo.buscarPorId.mockResolvedValue(rolFake);
            mockRepo.crear.mockResolvedValue(usuarioFake);

            const result = await useCase.crear(inputCrear);

            expect(mockRolRepo.buscarPorId).toHaveBeenCalledWith(inputCrear.idRol);
            expect(mockRepo.crear).toHaveBeenCalledWith(
                expect.objectContaining({ hashContrasena: expect.any(String) })
            );
            expect(mockRepo.crear).not.toHaveBeenCalledWith(
                expect.objectContaining({ contrasena: expect.anything() })
            );
            expect(result).toEqual(usuarioFake);
        });
    });

    describe('actualizar', () => {

        it('debe lanzar NotFoundError si el usuario no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(99, { nombre: 'Otro' }, ACTOR_ID)).rejects.toThrow(NotFoundError);
        });

        it('debe lanzar ConflictError si el usuario está desactivado', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...usuarioFake, activo: false });

            await expect(useCase.actualizar(1, { nombre: 'Otro' }, ACTOR_ID)).rejects.toThrow(ConflictError);
        });

        it('debe actualizar cuando el input no incluye idRol', async () => {
            mockRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockRepo.actualizar.mockResolvedValue({ ...usuarioFake, nombre: 'Otro' });

            const result = await useCase.actualizar(1, { nombre: 'Otro' }, ACTOR_ID);

            expect(mockRolRepo.buscarPorId).not.toHaveBeenCalled();
            expect(mockRepo.actualizar).toHaveBeenCalledWith(1, { nombre: 'Otro' });
            expect(result.nombre).toBe('Otro');
        });

        it('debe lanzar ForbiddenError si el actor intenta cambiar su propio rol', async () => {
            mockRepo.buscarPorId.mockResolvedValue({ ...usuarioFake, id: ACTOR_ID });

            await expect(useCase.actualizar(ACTOR_ID, { idRol: 3 }, ACTOR_ID)).rejects.toThrow(ForbiddenError);
            expect(mockRolRepo.buscarPorId).not.toHaveBeenCalled();
        });

        it('debe lanzar BadRequestError si el rol no existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockRolRepo.buscarPorId.mockResolvedValue(null);

            await expect(useCase.actualizar(1, { idRol: 999 }, ACTOR_ID)).rejects.toThrow(BadRequestError);
        });

        it('debe actualizar cuando el rol existe', async () => {
            mockRepo.buscarPorId.mockResolvedValue(usuarioFake);
            mockRolRepo.buscarPorId.mockResolvedValue(rolFake);
            mockRepo.actualizar.mockResolvedValue({ ...usuarioFake, idRol: 2 });

            const result = await useCase.actualizar(1, { idRol: 2 }, ACTOR_ID);

            expect(mockRolRepo.buscarPorId).toHaveBeenCalledWith(2);
            expect(mockRepo.actualizar).toHaveBeenCalledWith(1, { idRol: 2 });
            expect(result).toEqual(expect.objectContaining({ idRol: 2 }));
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
