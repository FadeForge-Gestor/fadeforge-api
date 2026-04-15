export const ROLES = {
    ADMIN: 'admin',
    EMPLEADO: 'empleado',
} as const;

export type RolClave = typeof ROLES[keyof typeof ROLES];
