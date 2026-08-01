import 'dotenv/config';

// Son requeridos estps campos
const required = ['DATABASE_URL', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'LOGO_URL'];

const emailVerificationEnabled = process.env.EMAIL_VERIFICATION_ENABLED === 'true';

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
    LOGO_URL: process.env.LOGO_URL!,
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
    EMAIL_FROM: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
    EMAIL_VERIFICATION_ENABLED: emailVerificationEnabled,
    EMAIL_VERIFICATION_EXPIRES_IN_HOURS: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS ?? '24'),
    FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    API_URL: process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
}