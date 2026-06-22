// Declaración de tipos para extender la interfaz Request de Express
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                correo: string;
                rol: string;
            };
            validatedParams?: Record<string, unknown>;
            validatedQuery?: Record<string, unknown>;
        }
    }
}

export {};