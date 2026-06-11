export interface HistorialPrecio {
    id: number;
    idServicio: number;
    precio: number;
    fechaInicio: Date;
    fechaFin: Date | null;
}

export interface CrearHistorialPrecioInput {
    idServicio: number;
    precio: number;
}
