import swaggerJSDoc from "swagger-jsdoc";

// Configurando Swagger para generar la documentación de la API
const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Gestor WEB API',
            version: '1.0.0',
            description: 'API para sistema de gestión de citas',
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Desarrollo' },
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
    }
}

export const swaggerSpec = swaggerJSDoc(options);