import 'dotenv/config';

// Son requeridos estps campos
const required = ['DATABASE_URL', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

// Verificar que las variables de entorno requeridas estén presentes
for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Variable de entorno requerida: ${key}`);
    }
}

// Exportar las variables de entorno con tipos adecuados
export const env = {
    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
}