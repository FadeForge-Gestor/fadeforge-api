import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

export default async function teardown(): Promise<void> {
    await prisma.$disconnect();
}
