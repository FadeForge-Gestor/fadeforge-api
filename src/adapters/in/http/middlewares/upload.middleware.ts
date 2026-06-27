import multer from 'multer';
import { BadRequestError } from '@shared/errors/HttpError';
import { Request } from 'express';

const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANIO_MAX = 5 * 1024 * 1024; // 5 MB

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: TAMANIO_MAX },
    fileFilter: (_req: Request, file, cb) => {
        if (!MIME_PERMITIDOS.includes(file.mimetype)) {
            return cb(new BadRequestError('Solo se permiten imágenes JPEG, PNG o WebP'));
        }
        cb(null, true);
    },
});
