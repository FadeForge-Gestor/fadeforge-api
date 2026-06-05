export interface DetalleCita {
    id: number;
    idCita: number;
    idServicio: number;
    precioAplicado: number;
    duracionMinutos: number;
}

export interface CrearDetalleCitaInput {
    idServicio: number;
    precioAplicado: number;
    duracionMinutos: number;
}
