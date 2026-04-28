import { Servicio, CrearServicioInput, ActualizarServicioInput } from "@core/domain/servicio/servicio.entity";

// Contrato que define las operaciones disponibles sobre los servicios.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente
export interface IServicioRepository {
    listarTodos(): Promise<Servicio[]>;
    listarActivos(): Promise<Servicio[]>
    buscarPorId(id: number): Promise<Servicio | null>;
    buscarPorNombre(nombre: string): Promise<Servicio | null>
    crear(input: CrearServicioInput): Promise<Servicio>;
    actualizar(id: number, input: ActualizarServicioInput): Promise<Servicio>;
    desactivar(id: number): Promise<void>;
}