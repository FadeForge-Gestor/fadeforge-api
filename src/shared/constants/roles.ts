// Diccionare de roles para el sistema
export const ROLES = {
    ADMIN: 'admin',
    EMPLEADO: 'empleado',
    CLIENTE: 'cliente',
} as const;

// Tipo de rol basado en las claves del diccionario de roles
export type RolClave = typeof ROLES[keyof typeof ROLES];
