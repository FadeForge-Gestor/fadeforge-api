import './config/env';
import app from './config/server';
import { env } from './config/env';

// Iniciando el servidor
app.listen(env.PORT, () => {
    console.log(`\n🚀 Servidor corriendo en modo ${env.NODE_ENV}`);
    console.log(`   API:  http://localhost:${env.PORT}/api/v1`);
    console.log(`   Docs: http://localhost:${env.PORT}/api/v1/docs\n`);
}) 
