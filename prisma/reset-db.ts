import 'dotenv/config';
import { execSync } from 'child_process';
import * as readline from 'node:readline';
import { Client } from 'pg';

const args = process.argv.slice(2);
const soloChequear = args.includes('--check');
const skipSeed = args.includes('--skip-seed');
const force = args.includes('--force');
const pedirAyuda = args.includes('--help') || args.includes('-h');

const SHELL = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';

interface DbCredentials {
    user: string;
    password: string;
    host: string;
    port: number;
    database: string;
}

function printUsage(): void {
    console.log(`
Uso: npm run prisma:reset-db [-- --check] [-- --force] [-- --skip-seed]

  (sin flags)  Borra la base de datos, la recrea, aplica migraciones,
               corre el seed y verifica que quede sincronizada con schema.prisma.
  --check      Solo verifica si la BD local coincide con schema.prisma (no borra nada).
  --force      Omite la confirmacion interactiva.
  --skip-seed  No ejecuta el seed (roles + admin inicial) tras las migraciones.
`);
}

function parseDatabaseUrl(raw: string): DbCredentials {
    const url = new URL(raw);
    const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
    if (!database) {
        throw new Error('No se pudo extraer el nombre de la base de datos de DATABASE_URL.');
    }
    return {
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        host: url.hostname,
        port: url.port ? Number(url.port) : 5432,
        database,
    };
}

function quoteIdent(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
}

function run(command: string): void {
    console.log(`\n$ ${command}`);
    execSync(command, { stdio: 'inherit', shell: SHELL });
}

// Corre un comando de Prisma y devuelve el exit code sin lanzar (para checks con --exit-code).
function runSoft(command: string): number {
    console.log(`\n$ ${command}`);
    try {
        execSync(command, { stdio: 'inherit', shell: SHELL });
        return 0;
    } catch (error) {
        return (error as { status?: number }).status ?? 1;
    }
}

async function connectAdmin(creds: Omit<DbCredentials, 'database'>): Promise<Client> {
    for (const db of ['postgres', 'template1']) {
        const client = new Client({ ...creds, database: db });
        try {
            await client.connect();
            return client;
        } catch {
            // Probamos con la siguiente base de mantenimiento.
        }
    }
    throw new Error('No se pudo conectar a la base de mantenimiento (postgres/template1). Revisa DATABASE_URL.');
}

// Compara la BD viva (via prisma.config.ts) contra schema.prisma.
function verificarSincronia(): number {
    return runSoft(
        'npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code'
    );
}

async function verificar(): Promise<void> {
    console.log('\n== Verificacion (sin borrar nada) ==');
    runSoft('npx prisma migrate status');
    const drift = verificarSincronia();
    if (drift === 0) {
        console.log('\n[OK] La base de datos local esta sincronizada con prisma/schema.prisma.');
    } else {
        console.log('\n[DRIFT] La base de datos local NO coincide con schema.prisma. Arriba se muestra el SQL que faltaria aplicar.');
        process.exitCode = 1;
    }
}

async function reset(creds: DbCredentials): Promise<void> {
    if (!force) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const respuesta = await new Promise<string>((resolve) => {
            rl.question(
                `\nVas a BORRAR la base de datos "${creds.database}". Escribi su nombre exacto para confirmar: `,
                resolve
            );
        });
        rl.close();
        if (respuesta.trim() !== creds.database) {
            console.log('\nCancelado: el nombre no coincide. No se borro nada.');
            return;
        }
    }

    const admin = await connectAdmin(creds);
    try {
        console.log(`\n== Borrando la base de datos "${creds.database}" ==`);
        await admin.query(`DROP DATABASE IF EXISTS ${quoteIdent(creds.database)} WITH (FORCE)`);
        console.log('Base de datos eliminada.');

        await admin.query(`CREATE DATABASE ${quoteIdent(creds.database)}`);
        console.log('Base de datos recreada.');
    } finally {
        await admin.end();
    }

    console.log('\n== Aplicando migraciones ==');
    run('npx prisma migrate deploy');

    if (!skipSeed) {
        console.log('\n== Ejecutando seed (roles + admin inicial) ==');
        run('npx prisma db seed');
    } else {
        console.log('\n(seed omitido por --skip-seed)');
    }

    console.log('\n== Verificacion final ==');
    const drift = verificarSincronia();
    if (drift === 0) {
        console.log('\n[OK] Base de datos recreada y sincronizada con prisma/schema.prisma.');
    } else {
        console.log('\n[WARN] Se aplicaron las migraciones pero la BD no queda sincronizada con schema.prisma (drift).');
        process.exitCode = 1;
    }
}

async function main(): Promise<void> {
    if (pedirAyuda) {
        printUsage();
        return;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('Falta DATABASE_URL en el .env');
    }

    const creds = parseDatabaseUrl(databaseUrl);

    if (soloChequear) {
        await verificar();
        return;
    }

    await reset(creds);
}

main().catch((error: unknown) => {
    console.error('\n[ERROR]', error instanceof Error ? error.message : error);
    process.exit(1);
});
