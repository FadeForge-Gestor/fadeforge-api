import { Cita, CrearCitaInput, ActualizarCitaInput, EstadoCita } from "@core/domain/cita/cita.entity";

export interface ICitasUseCase {
    listarPorRangoFecha(desde: Date, hasta: Date): Promise<Cita[]>;
    obtenerPorId(id: number): Promise<Cita>;
    obtenerPorFolio(folio: string): Promise<Cita>;
    listarPorCliente(idCliente: number): Promise<Cita[]>;
    crear(input: CrearCitaInput): Promise<Cita>;
    actualizar(id: number, input: ActualizarCitaInput): Promise<Cita>;
    cambiarEstado(id: number, estado: EstadoCita, motivoCancelado?: string, canceladoPor?: number): Promise<Cita>;
}
