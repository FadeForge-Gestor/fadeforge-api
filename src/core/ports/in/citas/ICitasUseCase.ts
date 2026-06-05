import { Cita, CrearCitaInput, ActualizarCitaInput } from "@core/domain/cita/cita.entity";

export interface ICitasUseCase {
    listarPorRangoFecha(desde: Date, hasta: Date): Promise<Cita[]>;
    obtenerPorId(id: number): Promise<Cita>;
    obtenerPorFolio(folio: string): Promise<Cita>;
    listarPorCliente(idCliente: number): Promise<Cita[]>;
    crear(input: CrearCitaInput): Promise<Cita>;
    actualizar(id: number, input: ActualizarCitaInput): Promise<Cita>;
}
