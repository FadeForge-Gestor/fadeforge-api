export interface CategoriaServicio {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    fechaCreacion: Date;
    fechaModificacion: Date;
}

export interface CrearCategoriaServicioInput {
    nombre: string;
    descripcion?: string;
}

export interface ActualizarCategoriaServicioInput {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
}