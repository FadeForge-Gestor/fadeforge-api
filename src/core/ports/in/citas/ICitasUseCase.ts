import { Cita, CrearCitaInput, ActualizarCitaInput, EstadoCita } from "@core/domain/cita/cita.entity";
import { Actor } from "@shared/types/actor";

export interface ICitasUseCase {
    listarPorRangoFecha(desde: Date, hasta: Date): Promise<Cita[]>;
    obtenerPorId(id: number, actor: Actor): Promise<Cita>;
    obtenerPorFolio(folio: string, actor: Actor): Promise<Cita>;
    listarPorCliente(idCliente: number, actor: Actor): Promise<Cita[]>;
    crear(input: CrearCitaInput): Promise<Cita>;
    actualizar(id: number, input: ActualizarCitaInput, actor: Actor): Promise<Cita>;
    cambiarEstado(id: number, estado: EstadoCita, motivoCancelado?: string, canceladoPor?: number): Promise<Cita>;
}
