// Clase personalizada para errores HTTP
export class HttpError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string 
    ) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// Datos invalidos en la solicitud
export class BadRequestError extends HttpError {
    constructor(message = 'Solicitud inválida') {
        super(400, message);
    }
}

// Error de autenticación
export class UnauthorizedError extends HttpError {
    constructor(message = 'Credenciales inválidas') {
        super(401, message);
    }
}

// Error de permisos insuficientes
export class ForbiddenError extends HttpError {
    constructor(message = 'Permisos insuficientes') {
        super(403, message);
    }
}

// Recurso no encontrado
export class NotFoundError extends HttpError {
    constructor(message = 'Recurso no encontrado') {
        super(404, message);
    }
}

// Conflicto con el estado actual del recurso
export class ConflictError extends HttpError {
    constructor(message = 'Conflicto con el estado actual del recurso') {
        super(409, message);
    }
}

// Error interno del servidor
export class InternalServerError extends HttpError {
    constructor(message = 'Error interno del servidor') {
        super(500, message);
    }
}