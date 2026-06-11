import { ICitaRepository } from "@core/ports/out/citas/ICitaRepository";
import { Cita, CrearCitaRepositoryInput, ActualizarCitaInput, CambiarEstadoCitaInput, EstadoCita } from "@core/domain/cita/cita.entity";
import { DetalleCita } from "@core/domain/detalle-cita/detalleCita.entity";
import { estado_cita } from "src/generated/prisma/enums";
import { prisma } from "../prisma.client";

export class CitasPrismaRepository implements ICitaRepository {

    private readonly ESTADO_A_DOMINIO: Record<estado_cita, EstadoCita> = {
        nueva:        'nueva',
        pendiente:    'pendiente',
        en_proceso:   'en_proceso',
        cancelada:    'cancelada',
        finalizada:   'finalizada',
        reprogramada: 'reprogramada',
        no_asistio:   'no_asistio',
    };

    private readonly ESTADO_A_PRISMA: Record<EstadoCita, estado_cita> = {
        'nueva':        estado_cita.nueva,
        'pendiente':    estado_cita.pendiente,
        'en_proceso':   estado_cita.en_proceso,
        'cancelada':    estado_cita.cancelada,
        'finalizada':   estado_cita.finalizada,
        'reprogramada': estado_cita.reprogramada,
        'no_asistio':   estado_cita.no_asistio,
    };

    private mapearDetalle(d: {
        id: number;
        id_cita: number;
        id_servicio: number;
        precio_aplicado: { toNumber(): number };
        duracion_minutos: number;
    }): DetalleCita {
        return {
            id: d.id,
            idCita: d.id_cita,
            idServicio: d.id_servicio,
            precioAplicado: d.precio_aplicado.toNumber(),
            duracionMinutos: d.duracion_minutos,
        };
    }

    private mapear(cita: {
        id: number;
        folio: string;
        id_clientes: number;
        id_empleado: number;
        fecha_inicio: Date;
        fecha_fin: Date;
        estado: estado_cita;
        motivo_cancelado: string | null;
        cancelado_por: number | null;
        fecha_creacion: Date;
        fecha_modificacion: Date;
        subtotal: { toNumber(): number };
        iva: { toNumber(): number };
        total: { toNumber(): number };
        detalle_cita: {
            id: number;
            id_cita: number;
            id_servicio: number;
            precio_aplicado: { toNumber(): number };
            duracion_minutos: number;
        }[];
    }): Cita {
        return {
            id: cita.id,
            folio: cita.folio,
            idCliente: cita.id_clientes,
            idEmpleado: cita.id_empleado,
            fechaInicio: cita.fecha_inicio,
            fechaFin: cita.fecha_fin,
            estado: this.ESTADO_A_DOMINIO[cita.estado],
            motivoCancelado: cita.motivo_cancelado,
            canceladoPor: cita.cancelado_por,
            fechaCreacion: cita.fecha_creacion,
            fechaModificacion: cita.fecha_modificacion,
            subtotal: cita.subtotal.toNumber(),
            iva: cita.iva.toNumber(),
            total: cita.total.toNumber(),
            detalle: cita.detalle_cita.map(d => this.mapearDetalle(d)),
        };
    }

    // Método para listar todas las citas dentro de un rango de fechas, ordenadas por fecha de inicio de forma ascendente
    async listarPorRangoFecha(desde: Date, hasta: Date): Promise<Cita[]> {
        const citas = await prisma.citas.findMany({
            where: {
                fecha_inicio: { gte: desde },
                fecha_fin: { lte: hasta },
            },
            include: { detalle_cita: true },
            orderBy: { fecha_inicio: 'asc' },
        });
        return citas.map(c => this.mapear(c));
    }

    // Método para buscar una cita por su ID, incluyendo su detalle, y devuelve null si no se encuentra
    async buscarPorId(id: number): Promise<Cita | null> {
        const cita = await prisma.citas.findUnique({
            where: { id },
            include: { detalle_cita: true },
        });
        if (!cita) return null;
        return this.mapear(cita);
    }

    // Método para buscar una cita por su folio, incluyendo su detalle, y devuelve null si no se encuentra
    async buscarPorFolio(folio: string): Promise<Cita | null> {
        const cita = await prisma.citas.findUnique({
            where: { folio },
            include: { detalle_cita: true },
        });
        if (!cita) return null;
        return this.mapear(cita);
    }

    // Método para buscar todas las citas de un cliente específico, ordenadas por fecha de inicio de forma descendente
    async buscarPorCliente(idCliente: number): Promise<Cita[]> {
        const citas = await prisma.citas.findMany({
            where: { id_clientes: idCliente },
            include: { detalle_cita: true },
            orderBy: { fecha_inicio: 'desc' },
        });
        return citas.map(c => this.mapear(c));
    }

    // Método para crear una nueva cita junto con su detalle, y asignarle un folio único basado en su ID después de crearla
    async crear(input: CrearCitaRepositoryInput): Promise<Cita> {
        const cita = await prisma.citas.create({
            data: {
                folio: '',
                id_clientes: input.idCliente,
                id_empleado: input.idEmpleado,
                fecha_inicio: input.fechaInicio,
                fecha_fin: input.fechaFin,
                subtotal: input.subtotal,
                iva: input.iva,
                total: input.total,
                detalle_cita: {
                    createMany: {
                        data: input.detalle.map(d => ({
                            id_servicio: d.idServicio,
                            precio_aplicado: d.precioAplicado,
                            duracion_minutos: d.duracionMinutos,
                        })),
                    },
                },
            },
            include: { detalle_cita: true },
        });
        return this.mapear(cita);
    }

    // Método para actualizar los campos editables de una cita, sin modificar su estado
    async actualizar(id: number, input: ActualizarCitaInput): Promise<Cita> {
        const cita = await prisma.citas.update({
            where: { id },
            data: {
                ...(input.idEmpleado !== undefined && { id_empleado: input.idEmpleado }),
                ...(input.fechaInicio !== undefined && { fecha_inicio: input.fechaInicio }),
                ...(input.fechaFin !== undefined && { fecha_fin: input.fechaFin }),
                ...(input.subtotal !== undefined && { subtotal: input.subtotal }),
                ...(input.iva !== undefined && { iva: input.iva }),
                ...(input.total !== undefined && { total: input.total }),
                fecha_modificacion: new Date(),
            },
            include: { detalle_cita: true },
        });
        return this.mapear(cita);
    }

    // Método para cambiar el estado de una cita, con la opción de agregar motivo y quién canceló en caso de que el nuevo estado sea "cancelada"
    async cambiarEstado(id: number, input: CambiarEstadoCitaInput): Promise<Cita> {
        const cita = await prisma.citas.update({
            where: { id },
            data: {
                estado: this.ESTADO_A_PRISMA[input.estado],
                ...(input.motivoCancelado !== undefined && { motivo_cancelado: input.motivoCancelado }),
                ...(input.canceladoPor !== undefined && { cancelado_por: input.canceladoPor }),
                fecha_modificacion: new Date(),
            },
            include: { detalle_cita: true },
        });
        return this.mapear(cita);
    }

}
