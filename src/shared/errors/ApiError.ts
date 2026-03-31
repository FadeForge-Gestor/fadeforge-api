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

// Tipo para representar una respuesta de API que puede ser un éxito o un error
export type ApiResponse<T> = ApiSuccessBody<T> | ApiErrorBody;