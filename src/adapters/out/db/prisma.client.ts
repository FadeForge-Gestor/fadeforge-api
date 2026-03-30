import { PrismaClient } from "src/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';

// Crea el adpter que sabe cómo conectarse a la BD
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// Busca si ya existe una instancia guardada en el objeto global
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Reutiliza la existente, o crea una nueva si no hay niguna instancia guardada
export const prisma =
    globalForPrisma.prisma ?? new PrismaClient({ adapter });

// En el desarrollo, guarda la instancia en GlobalThis para que no se cree una nueva en cada reinicio del servidor
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
