import { randomUUID } from 'crypto';

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
