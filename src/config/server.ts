import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRoutes from '@adapters/in/http/auth/auth.routes';
import { errorMiddleware } from '@adapters/in/http/middlewares/error.middleware';
import { swaggerSpec } from './swagger';

// Configuración del servidor Express
const app = express();

app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/v1/auth', authRoutes);

// Middleware para manejo de errores
app.use(errorMiddleware);

export default app;