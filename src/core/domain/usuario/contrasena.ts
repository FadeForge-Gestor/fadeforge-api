const CONTRASENA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;

export function validarContrasena(contrasena: string): string | null {
    if (contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (/\s/.test(contrasena)) return 'La contraseña no puede contener espacios';
    if (!CONTRASENA_REGEX.test(contrasena)) return 'La contraseña debe tener mayúsculas, minúsculas, números y símbolos';
    return null;
}
