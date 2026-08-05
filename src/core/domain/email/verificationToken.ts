import { createHash, randomUUID } from 'crypto';

export interface VerificationTokenData {
    idUsuario: number;
    expiraEn: Date;
}

export function generarToken(): string {
    return randomUUID();
}

export function calcularExpiracion(hours: number): Date {
    const expira = new Date();
    expira.setHours(expira.getHours() + hours);
    return expira;
}

/**
 * Digest determinístico del token de verificación.
 * El token es un UUID (122 bits de entropía): SHA-256 alcanza para resistir
 * preimagen y permite lookup por índice único en O(1). Es un detalle de
 * persistencia: el repositorio es dueño del hashing, los use cases operan
 * con el token en claro.
 */
export function hashearToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
