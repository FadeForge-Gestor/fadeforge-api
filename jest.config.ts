import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@middlewares/(.*)$': '<rootDir>/src/adapters/in/http/middlewares/$1',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/generated/**',
        '!src/app.ts',
        '!src/config/server.ts',
        '!src/config/swagger.ts',
    ],
    coverageDirectory: 'coverage',
};

export default config;
