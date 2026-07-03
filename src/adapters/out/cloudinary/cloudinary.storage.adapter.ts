import { v2 as cloudinary } from 'cloudinary';
import { env } from '@config/env';
import { IStoragePort, ArchivoInput, ImagenSubida } from '@core/ports/out/storage/IStoragePort';

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryStorageAdapter implements IStoragePort {

    async subir(archivo: ArchivoInput): Promise<ImagenSubida> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: `fadeforge/${env.NODE_ENV === 'production' ? 'prod' : 'dev'}/servicios`, resource_type: 'image' },
                (error, result) => {
                    if (error || !result) return reject(error ?? new Error('Upload fallido'));
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        nombre: archivo.nombreOriginal,
                    });
                }
            );
            stream.end(archivo.buffer);
        });
    }

    async eliminar(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId);
    }
}
