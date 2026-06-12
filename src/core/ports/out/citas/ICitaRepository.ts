import { Cita, CrearCitaRepositoryInput, ActualizarCitaInput, CambiarEstadoCitaInput } from "@core/domain/cita/cita.entity";

export interface ICitaRepository {
    listarPorRangoFecha(desde: Date, hasta: Date): Promise<Cita[]>;
    buscarPorId(id: number): Promise<Cita | null>;
    buscarPorFolio(folio: string): Promise<Cita | null>;
    buscarPorCliente(idCliente: number): Promise<Cita[]>;
    crear(input: CrearCitaRepositoryInput): Promise<Cita>;
    actualizar(id: number, input: ActualizarCitaInput): Promise<Cita>;
    cambiarEstado(id: number, input: CambiarEstadoCitaInput): Promise<Cita>;
    verificarSolapamientoEmpleado(idEmpleado: number, fechaInicio: Date, fechaFin: Date, idCitaExcluida?: number): Promise<boolean>;
}
