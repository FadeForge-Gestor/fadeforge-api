// Entidad del dominio que representa un Rol en el sistema.
// No depende de ningún framework ni librería externa.
// Los roles son fijos (admin, empleado, cliente) y se siembran vía prisma/seed.ts,
// por eso este módulo solo expone operaciones de lectura.
export interface Rol {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    fechaCreacion: Date;
    fechaModificacion: Date;
}
