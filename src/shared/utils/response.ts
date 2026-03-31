// Constante para representar una respuesta exitosa de API con un cuerpo genérico
export const ok = <T>(data: T) => ({ ok: true as const, data });

// Contante para representar una respuesta de error de API con un cuerpo específico
export const fail = (name: string, message: string, stack?: string) => ({
    ok: false as const,
    name,
    message,
    stack,
})