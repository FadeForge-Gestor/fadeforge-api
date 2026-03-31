// Interface para representar el cuerpo de un error de API
export interface ApiErrorBody {
    ok: false;
    name: string;
    message: string;
    stack?: string;
}

// Interface para representar el cuerpo de una respuesta exitosa de API
export interface ApiSuccessBody<T> {
    ok: true;
    data: T;
}