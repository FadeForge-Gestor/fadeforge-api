import { prisma } from '@adapters/out/db/prisma.client';

export default async function teardown(): Promise<void> {
    await prisma.$disconnect();
}
