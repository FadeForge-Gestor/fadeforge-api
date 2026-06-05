import { ICitaRepository } from "@core/ports/out/citas/ICitaRepository";
import { IUsuarioRepository } from "@core/ports/out/usuarios/IUsuarioRepository";
import { IEmpleadoRepository } from "@core/ports/out/empleados/IEmpleadoRepository";
import { ICitasUseCase } from "@core/ports/in/citas/ICitasUseCase";
import { Cita, CrearCitaInput, ActualizarCitaInput, EstadoCita, CambiarEstadoCitaInput } from "@core/domain/cita/cita.entity";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";

export class CitasUseCase implements ICitasUseCase {

    constructor(
        private readonly citasRepository: ICitaRepository,
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly empleadoRepository: IEmpleadoRepository
    ) {}

    // Método para listar las citas dentro de un rango de fechas
    async listarPorRangoFecha(desde: Date, hasta: Date): Promise<Cita[]> {
        return this.citasRepository.listarPorRangoFecha(desde, hasta);
    }

    // Método para obtener una cita por su ID
    async obtenerPorId(id: number): Promise<Cita> {
        const cita = await this.citasRepository.buscarPorId(id);
        if (!cita) throw new NotFoundError(`Cita con id ${id} no encontrada`);
        return cita;
    }

    // Método para obtener una cita por su folio
    async obtenerPorFolio(folio: string): Promise<Cita> {
        const cita = await this.citasRepository.buscarPorFolio(folio);
        if (!cita) throw new NotFoundError(`Cita con folio ${folio} no encontrada`);
        return cita;
    }

    // Métodos para listar las citas de un cliente en específico
    async listarPorCliente(idCliente: number): Promise<Cita[]> {
        return this.citasRepository.buscarPorCliente(idCliente);
    }

    // Método para crear una nueva cita
    async crear(input: CrearCitaInput): Promise<Cita> {
        if (input.fechaInicio >= input.fechaFin) throw new ConflictError('La fecha de inicio debe ser menor que la fecha de fin');
        if (input.fechaInicio <= new Date()) throw new ConflictError('La fecha de inicio debe ser en el futuro');

        const cliente = await this.usuarioRepository.buscarPorId(input.idCliente);
        if (!cliente) throw new NotFoundError(`Cliente con id ${input.idCliente} no encontrado`);
        if (!cliente.activo) throw new ConflictError(`El cliente con id ${input.idCliente} está desactivado`);

        const empleado = await this.empleadoRepository.buscarPorId(input.idEmpleado);
        if (!empleado) throw new NotFoundError(`Empleado con id ${input.idEmpleado} no encontrado`);
        if (!empleado.activo) throw new ConflictError(`El empleado con id ${input.idEmpleado} está desactivado`);

        return this.citasRepository.crear(input);
    }

    // Método para actualizar una cita existente
    async actualizar(id: number, input: ActualizarCitaInput): Promise<Cita> {
        const cita = await this.citasRepository.buscarPorId(id);
        if (!cita) throw new NotFoundError(`Cita con id ${id} no encontrada`);

        if (cita.estado === 'cancelada' || cita.estado === 'finalizada') {
            throw new ConflictError(`La cita con id ${id} no puede modificarse porque está ${cita.estado}`);
        }

        if (input.idEmpleado !== undefined) {
            const empleado = await this.empleadoRepository.buscarPorId(input.idEmpleado);
            if (!empleado) throw new NotFoundError(`Empleado con id ${input.idEmpleado} no encontrado`);
            if (!empleado.activo) throw new ConflictError(`El empleado con id ${input.idEmpleado} está desactivado`);
        }

        return this.citasRepository.actualizar(id, input);
    }

    // Método para cambiar el estado de una cita
    async cambiarEstado(id: number, estado: EstadoCita, motivoCancelado?: string, canceladoPor?: number): Promise<Cita> {
        const cita = await this.citasRepository.buscarPorId(id);
        if (!cita) throw new NotFoundError(`Cita con id ${id} no encontrada`);

        const transicionesValidas: Partial<Record<EstadoCita, EstadoCita[]>> = {
            'nueva':     ['pendiente', 'cancelada'],
            'pendiente': ['en proceso', 'cancelada', 'reprogramada'],
            'en proceso': ['finalizada', 'cancelada'],
        };

        const permitidos = transicionesValidas[cita.estado];
        if (!permitidos) {
            throw new ConflictError(`La cita no puede cambiar de estado porque se encuentra en estado '${cita.estado}' (estado terminal)`);
        }
        if (!permitidos.includes(estado)) {
            throw new ConflictError(`Transición de estado inválida: no se puede pasar de '${cita.estado}' a '${estado}'`);
        }

        if (estado === 'cancelada' && !motivoCancelado) {
            throw new ConflictError('El motivo de cancelación es requerido para cancelar una cita');
        }

        return this.citasRepository.cambiarEstado(id, { estado, motivoCancelado, canceladoPor });
    }

}
