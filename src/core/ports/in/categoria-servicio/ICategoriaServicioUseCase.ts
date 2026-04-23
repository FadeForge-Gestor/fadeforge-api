import { CategoriaServicio, CrearCategoriaServicioInput, ActualizarCategoriaServicioInput } from "@core/domain/categoria-servicio/categoriaServicio.entity";

// Contrato que define las operaciones disponibles sobre las categorias de servicios.
// El controller solo conoce esta interfaz, nunca la implementación concreta.
export interface ICategoriaServicioUseCase {
    listar(): Promise<CategoriaServicio[]>;
    listarActivos(): Promise<CategoriaServicio[]>;
    obtenerPorId(id: number): Promise<CategoriaServicio>;
    crear(input: CrearCategoriaServicioInput): Promise<CategoriaServicio>;
    actualizar(id: number, input: ActualizarCategoriaServicioInput): Promise<CategoriaServicio>;
    desactivar(id: number): Promise<void>;
}