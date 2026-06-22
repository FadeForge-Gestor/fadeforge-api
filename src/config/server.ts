import express from 'express';
import cors from 'cors';
import { Router } from 'express';
import { authenticate, authorize } from '@adapters/in/http/middlewares/auth.middleware';
import { ROLES } from '@shared/constants/roles';

// Importamos Swagger UI para la documentación y Configuración de Swagger (definida en otro archivo)
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger'; 

// Importamos las rutas
import authRoutes from '@adapters/in/http/auth/auth.routes';
import rolesRoutes from '@adapters/in/http/roles/roles.routes';
import usuariosRoutes from '@adapters/in/http/usuarios/usuarios.routes';
import credencialesRoutes from '@adapters/in/http/credenciales/credenciales.routes';
import empleadosRoutes from '@adapters/in/http/empleados/empleados.routes';
import categoriaServiciosRoutes from '@adapters/in/http/categoria-servicio/categoriaServicios.routes';
import serviciosRoutes from '@adapters/in/http/servicios/servicios.routes';
import citasRoutes from '@adapters/in/http/citas/citas.routes';
import detalleCitaRoutes from '@adapters/in/http/detalle-cita/detalleCita.routes';
import historialPrecioRoutes from '@adapters/in/http/historial-precio/historialPrecio.routes';

// Importamos el middleware de manejo de errores
import { errorMiddleware } from '@adapters/in/http/middlewares/error.middleware';


// Configuración del servidor Express
const app = express();

app.use(cors());
app.use(express.json());

// Documentación Swagger
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const adminRouter = Router();
adminRouter.use(authenticate, authorize(ROLES.ADMIN));
adminRouter.use('/roles', rolesRoutes);
adminRouter.use('/usuarios', usuariosRoutes);
adminRouter.use('/empleados', empleadosRoutes);

// Rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/credenciales', credencialesRoutes);
app.use('/api/v1/categoriaServicios', categoriaServiciosRoutes);
app.use('/api/v1/servicios', serviciosRoutes);
app.use('/api/v1/citas', citasRoutes);
app.use('/api/v1/detalle-cita', detalleCitaRoutes);
app.use('/api/v1/historial-precios', historialPrecioRoutes);
// Middleware para manejo de errores
app.use(errorMiddleware);

export default app;