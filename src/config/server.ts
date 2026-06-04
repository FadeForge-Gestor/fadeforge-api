import express from 'express';
import cors from 'cors';

// Importamos Swagger UI para la documentación y Configuración de Swagger (definida en otro archivo)
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger'; 

// Importamos las rutas
import authRoutes from '@adapters/in/http/auth/auth.routes';
import rolesRoutes from '@adapters/in/http/roles/roles.routes';
import usuariosRoutes from '@adapters/in/http/usuarios/usuarios.routes';
import credencialesRoutes from '@adapters/in/http/credenciales/credenciales.routes';
import empleadosRoutes from '@adapters/in/http/empleados/empleados.routes';
import categoriaServiciosRoutes from '@adapters/in/http/categoria-servicio/categoriaServiciosRoutes.routes';
import serviciosRoutes from '@adapters/in/http/servicios/serviciosRoutes.routes';

// Importamos el middleware de manejo de errores
import { errorMiddleware } from '@adapters/in/http/middlewares/error.middleware';


// Configuración del servidor Express
const app = express();

app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);
app.use('/api/v1/credenciales', credencialesRoutes);
app.use('/api/v1/empleados', empleadosRoutes);
app.use('/api/v1/categoriaServicios', categoriaServiciosRoutes);
app.use('/api/v1/servicios', serviciosRoutes);
// Middleware para manejo de errores
app.use(errorMiddleware);

export default app;