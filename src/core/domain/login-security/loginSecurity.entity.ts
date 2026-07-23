export interface IntentosFallidos {
    correo: string;
    intentosFallidos: number;
}

export interface EstadoBloqueo {
    correo: string;
    intentosFallidos: number;
    bloqueadoHasta: Date | null;
    tiempoRestanteMs: number | null;
}
