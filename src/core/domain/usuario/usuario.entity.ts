export interface Usuario {
    id: number;
    nombre: string;
    aPaterno: string;
    aMaterno: string | null;
    telefono: string;
    idRol: number;
}