export interface Servicio {
    id: number;
    nombre: string;
    descripcion: string | null;
    duracionMinutos: number;
    idCategoria: number;
    imagenUrl: string | null;
    idImagen: string | null;
    nombreImagen: string | null;
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
    idImagen?: string;
    nombreImagen?: string;
}

export interface ActualizarServicioInput {
    nombre?: string;
    descripcion?: string;
    duracionMinutos?: number;
    idCategoria?: number;
    imagenUrl?: string;
    idImagen?: string;
    nombreImagen?: string;
}