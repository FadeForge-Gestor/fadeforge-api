import express from 'express';
import cors from 'cors';
import authRoutes from '@adapters/in/http/auth/auth.routes';
import { errorMiddleware } from '@adapters/in/http/middlewares/error.middleware';

// Configuración del servidor Express
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Middleware para manejo de errores
app.use(errorMiddleware);

export default app;