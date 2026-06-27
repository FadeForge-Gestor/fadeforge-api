export interface ArchivoInput {
    buffer: Buffer;
    nombreOriginal: string;
}

export interface ImagenSubida {
    url: string;
    publicId: string;
    nombre: string;
}

export interface IStoragePort {
    subir(archivo: ArchivoInput): Promise<ImagenSubida>;
    eliminar(publicId: string): Promise<void>;
}
