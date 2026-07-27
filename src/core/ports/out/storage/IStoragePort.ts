import { ArchivoInput, ImagenSubida } from '@core/domain/storage/storage.entity';

export interface IStoragePort {
    subir(archivo: ArchivoInput): Promise<ImagenSubida>;
    eliminar(publicId: string): Promise<void>;
}
