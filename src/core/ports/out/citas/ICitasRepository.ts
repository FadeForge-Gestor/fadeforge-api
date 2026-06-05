import { Cita, CrearCitaInput, ActualizarCitaInput, CambiarEstadoCitaInput } from "@core/domain/cita/cita.entity";

export interface ICitasRepository {
    listarPorRangoFecha(desde: Date, hasta: Date): Promise<Cita[]>;
    buscarPorId(id: number): Promise<Cita | null>;
    buscarPorFolio(folio: string): Promise<Cita | null>;
    buscarPorCliente(idCliente: number): Promise<Cita[]>;
    crear(input: CrearCitaInput): Promise<Cita>;
    actualizar(id: number, input: ActualizarCitaInput): Promise<Cita>;
    cambiarEstado(id: number, input: CambiarEstadoCitaInput): Promise<Cita>;
}
