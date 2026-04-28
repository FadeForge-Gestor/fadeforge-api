export interface Servicio {
    id: number;
    nombre: string;
    descripcion: string | null;
    duracionMinutos: number;
    idCategoria: number;
    imagenUrl: string | null;
    activo: boolean;
    fechaCreacion: Date;
    fechaModificacion: Date;
}

export interface CrearServicioInput {
    nombre: string;
    descripcion?: string;
    duracionMinutos: number;
    idCategoria: number;
    imagenUrl?: string;
}

export interface ActualizarServicioInput {
    nombre?: string;
    descripcion?: string;
    duracionMinutos?: number;
    idCategoria?: number;
    imagenUrl?: string;
    activo?: boolean;
}