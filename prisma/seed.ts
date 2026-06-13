import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { ROLES } from '../src/shared/constants/roles';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {

    // Roles del sistema — son parte del diseño, no datos de usuario
    await Promise.all([
        prisma.roles.upsert({
            where: { clave: ROLES.ADMIN },
            update: {},
            create: { clave: ROLES.ADMIN, nombre: 'Administrador', descripcion: 'Acceso total al sistema' },
        }),
        prisma.roles.upsert({
            where: { clave: ROLES.EMPLEADO },
            update: {},
            create: { clave: ROLES.EMPLEADO, nombre: 'Empleado', descripcion: 'Gestión de citas y servicios' },
        }),
        prisma.roles.upsert({
            where: { clave: ROLES.CLIENTE },
            update: {},
            create: { clave: ROLES.CLIENTE, nombre: 'Cliente', descripcion: 'Reserva y consulta de citas' },
        }),
    ]);
    console.log('✓ Roles creados');

    // Admin inicial — solo se crea si no existe
    const correoAdmin = process.env.ADMIN_SEED_EMAIL;
    if (!correoAdmin) throw new Error('ADMIN_SEED_EMAIL no está definida en .env');

    const adminExiste = await prisma.credenciales_usuarios.findUnique({
        where: { correo: correoAdmin },
    });

    if (!adminExiste) {
        const contrasenaAdmin = process.env.ADMIN_SEED_PASSWORD;
        if (!contrasenaAdmin) throw new Error('ADMIN_SEED_PASSWORD no está definida en .env');

        const hashContrasena = await bcrypt.hash(contrasenaAdmin, 10);

        await prisma.usuarios.create({
            data: {
                nombre: 'Admin',
                a_paterno: 'Sistema',
                telefono: '0000000000',
                roles: { connect: { clave: ROLES.ADMIN } },
                credenciales_usuarios: {
                    create: {
                        correo: correoAdmin,
                        hash_contrasena: hashContrasena,
                    },
                },
            },
        });
        console.log('✓ Admin inicial creado');
    } else {
        console.log('→ Admin ya existe, omitido');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
