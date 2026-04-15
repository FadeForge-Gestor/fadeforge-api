// Entidad del dominio que representa un Rol en el sistema.
// No depende de ningún framework ni librería externa.
export interface Rol {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    fechaCreacion: Date;
}

// Datos necesarios para crear un rol (id y fechaCreacion los genera la BD)
export interface CrearRolInput {
    clave: string;
    nombre: string;
    descripcion?: string;
}

// Datos que se pueden actualizar (todos opcionales)
export interface ActualizarRolInput {
    clave?: string;
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
}
