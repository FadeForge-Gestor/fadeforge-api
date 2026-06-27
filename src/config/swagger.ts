import swaggerJSDoc from "swagger-jsdoc";

// Configurando Swagger para generar la documentación de la API
const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FadeForge Gestor API',
            version: '1.0.0',
            description: 'API para sistema de gestión de citas',
        },
        servers: [
            { url: 'http://localhost:3000/api/v1', description: 'Desarrollo' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        }
    },
    apis: [
        'src/adapters/in/http/**/*.routes.ts',
        'src/adapters/in/http/**/*.docs.ts',
    ],
}

export const swaggerSpec = swaggerJSDoc(options);