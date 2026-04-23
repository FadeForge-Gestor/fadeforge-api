import { CategoriaServicio, CrearCategoriaServicioInput, ActualizarCategoriaServicioInput } from "@core/domain/categoria-servicio/categoriaServicio.entity";

// Contrato que define las operaciones disponibles sobre las categorias de servicios.
// El caso de uso solo conoce esta interfaz, nunca Prisma directamente
export interface ICategoriaServicioRepository {
    listarTodos(): Promise<CategoriaServicio[]>;
    listarActivos(): Promise<CategoriaServicio[]>
    buscarPorId(id: number): Promise<CategoriaServicio | null>;
    crear(input: CrearCategoriaServicioInput): Promise<CategoriaServicio>;
    actualizar(id: number, input: ActualizarCategoriaServicioInput): Promise<CategoriaServicio>;
    desactivar(id: number): Promise<void>;
}