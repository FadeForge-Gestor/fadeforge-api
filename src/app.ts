import './config/env';
import app from './config/server';
import { env } from './config/env';

// Iniciando el servidor
app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
}) 
