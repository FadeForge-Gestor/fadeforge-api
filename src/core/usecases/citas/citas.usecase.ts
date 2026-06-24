import { ICitaRepository } from "@core/ports/out/citas/ICitaRepository";
import { IUsuarioRepository } from "@core/ports/out/usuarios/IUsuarioRepository";
import { IEmpleadoRepository } from "@core/ports/out/empleados/IEmpleadoRepository";
import { IServicioRepository } from "@core/ports/out/servicios/IServicioRepository";
import { ICitasUseCase } from "@core/ports/in/citas/ICitasUseCase";
import { Cita, CrearCitaInput, ActualizarCitaInput, EstadoCita } from "@core/domain/cita/cita.entity";
import { CrearDetalleCitaInput } from "@core/domain/detalle-cita/detalleCita.entity";
import { ConflictError, NotFoundError } from "@shared/errors/HttpError";
import { IVA_RATE } from "@shared/constants/iva";
import { Actor } from "@shared/types/actor";
import { ROLES } from "@shared/constants/roles";

export class CitasUseCase implements ICitasUseCase {

    constructor(
        private readonly citasRepository: ICitaRepository,
        private readonly usuarioRepository: IUsuarioRepository,
        private readonly empleadoRepository: IEmpleadoRepository,
        private readonly servicioRepository: IServicioRepository
    ) {}

    async listarPorRangoFecha(desde: Date, hasta: Date): Promise<Cita[]> {
        return this.citasRepository.listarPorRangoFecha(desde, hasta);
    }

    async obtenerPorId(id: number, actor: Actor): Promise<Cita> {
        const cita = await this.citasRepository.buscarPorId(id);
        if (!cita) throw new NotFoundError(`Cita con id ${id} no encontrada`);
        this.validarAcceso(cita, actor);
        return cita;
    }

    async obtenerPorFolio(folio: string, actor: Actor): Promise<Cita> {
        const cita = await this.citasRepository.buscarPorFolio(folio);
        if (!cita) throw new NotFoundError(`Cita con folio ${folio} no encontrada`);
        this.validarAcceso(cita, actor);
        return cita;
    }

    async listarPorCliente(idCliente: number, actor: Actor): Promise<Cita[]> {
        if (actor.rol === ROLES.CLIENTE && actor.id !== idCliente)
            throw new NotFoundError('Cita no encontrada');
        return this.citasRepository.buscarPorCliente(idCliente);
    }

    async crear(input: CrearCitaInput, actor: Actor): Promise<Cita> {
        const idCliente = actor.rol === ROLES.CLIENTE ? actor.id : input.idCliente;
        if (!idCliente) throw new ConflictError('El campo idCliente es requerido');
        input = { ...input, idCliente };

        if (!input.servicios || input.servicios.length === 0)
            throw new ConflictError('La cita debe incluir al menos un servicio');

        if (input.fechaInicio <= new Date())
            throw new ConflictError('La fecha de inicio debe ser en el futuro');

        const cliente = await this.usuarioRepository.buscarPorId(input.idCliente);
        if (!cliente) throw new NotFoundError(`Cliente con id ${input.idCliente} no encontrado`);
        if (!cliente.activo) throw new ConflictError(`El cliente con id ${input.idCliente} está desactivado`);

        const empleado = await this.empleadoRepository.buscarPorId(input.idEmpleado);
        if (!empleado) throw new NotFoundError(`Empleado con id ${input.idEmpleado} no encontrado`);
        if (!empleado.activo) throw new ConflictError(`El empleado con id ${input.idEmpleado} está desactivado`);

        const ids = input.servicios.map(item => item.idServicio);
        const [servicios, precios] = await Promise.all([
            this.servicioRepository.buscarPorIds(ids),
            this.servicioRepository.buscarPreciosActuales(ids),
        ]);

        const serviciosMap = new Map(servicios.map(s => [s.id, s]));
        const detalle: CrearDetalleCitaInput[] = [];
        let totalMinutos = 0;
        let subtotal = 0;

        for (const item of input.servicios) {
            const servicio = serviciosMap.get(item.idServicio);
            if (!servicio) throw new NotFoundError(`Servicio con id ${item.idServicio} no encontrado`);
            if (!servicio.activo) throw new ConflictError(`El servicio con id ${item.idServicio} está desactivado`);

            const precio = precios.get(item.idServicio);
            if (precio === undefined) throw new ConflictError(`El servicio con id ${item.idServicio} no tiene precio registrado`);

            detalle.push({ idServicio: item.idServicio, precioAplicado: precio, duracionMinutos: servicio.duracionMinutos });
            totalMinutos += servicio.duracionMinutos;
            subtotal += precio;
        }

        const fechaFin = new Date(input.fechaInicio.getTime() + totalMinutos * 60 * 1000);

        const solapamiento = await this.citasRepository.verificarSolapamientoEmpleado(
            input.idEmpleado,
            input.fechaInicio,
            fechaFin
        );
        if (solapamiento)
            throw new ConflictError(`El empleado con id ${input.idEmpleado} ya tiene una cita en ese horario`);

        const iva = Math.round(subtotal * IVA_RATE * 100) / 100;
        const total = Math.round((subtotal + iva) * 100) / 100;

        return this.citasRepository.crear({
            idCliente: input.idCliente,
            idEmpleado: input.idEmpleado,
            fechaInicio: input.fechaInicio,
            fechaFin,
            subtotal,
            iva,
            total,
            detalle,
        });
    }

    async actualizar(id: number, input: ActualizarCitaInput, actor: Actor): Promise<Cita> {
        const cita = await this.citasRepository.buscarPorId(id);
        if (!cita) throw new NotFoundError(`Cita con id ${id} no encontrada`);
        this.validarAcceso(cita, actor);

        if (cita.estado === 'cancelada' || cita.estado === 'finalizada')
            throw new ConflictError(`La cita con id ${id} no puede modificarse porque está ${cita.estado}`);

        if (input.idEmpleado !== undefined) {
            const empleado = await this.empleadoRepository.buscarPorId(input.idEmpleado);
            if (!empleado) throw new NotFoundError(`Empleado con id ${input.idEmpleado} no encontrado`);
            if (!empleado.activo) throw new ConflictError(`El empleado con id ${input.idEmpleado} está desactivado`);
        }

        const hayConflictoPotencial =
            input.idEmpleado !== undefined ||
            input.fechaInicio !== undefined ||
            input.fechaFin !== undefined;

        if (hayConflictoPotencial) {
            const empleadoEfectivo = input.idEmpleado ?? cita.idEmpleado;
            const inicioEfectivo   = input.fechaInicio ?? cita.fechaInicio;
            const finEfectivo      = input.fechaFin    ?? cita.fechaFin;

            const solapamiento = await this.citasRepository.verificarSolapamientoEmpleado(
                empleadoEfectivo,
                inicioEfectivo,
                finEfectivo,
                id
            );
            if (solapamiento)
                throw new ConflictError(`El empleado con id ${empleadoEfectivo} ya tiene una cita en ese horario`);
        }

        return this.citasRepository.actualizar(id, input);
    }

    private validarAcceso(cita: Cita, actor: Actor): void {
        if (actor.rol === ROLES.CLIENTE && cita.idCliente !== actor.id) {
            throw new NotFoundError('Cita no encontrada');
        }
    }

    async cambiarEstado(id: number, estado: EstadoCita, motivoCancelado?: string, canceladoPor?: number): Promise<Cita> {
        const cita = await this.citasRepository.buscarPorId(id);
        if (!cita) throw new NotFoundError(`Cita con id ${id} no encontrada`);

        const transicionesValidas: Partial<Record<EstadoCita, EstadoCita[]>> = {
            'nueva':      ['pendiente', 'cancelada'],
            'pendiente':   ['en_proceso', 'cancelada', 'reprogramada'],
            'en_proceso':  ['finalizada', 'cancelada'],
        };

        const permitidos = transicionesValidas[cita.estado];
        if (!permitidos)
            throw new ConflictError(`La cita no puede cambiar de estado porque se encuentra en estado '${cita.estado}' (estado terminal)`);

        if (!permitidos.includes(estado))
            throw new ConflictError(`Transición de estado inválida: no se puede pasar de '${cita.estado}' a '${estado}'`);

        if (estado === 'cancelada' && !motivoCancelado)
            throw new ConflictError('El motivo de cancelación es requerido para cancelar una cita');

        return this.citasRepository.cambiarEstado(id, { estado, motivoCancelado, canceladoPor });
    }

}
